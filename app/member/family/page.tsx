'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { FamilyView } from '@/components/member/FamilyView'
import { createClient } from '@/lib/supabase/client'
import type { FamilyMember, Nakshatra } from '@/types/database'
import { NoMembershipState } from '@/components/member/NoMembershipState'

const NAKSHATRAS: Nakshatra[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

const RELATIONSHIPS = ['Child', 'Parent', 'Sibling', 'Grandparent', 'Grandchild', 'Other']

interface FamilyMemberForm {
  id?: string
  first_name: string
  last_name: string
  relationship: string
  date_of_birth: string
  nakshatra: Nakshatra | ''
  email: string
}

const emptyForm: FamilyMemberForm = {
  first_name: '',
  last_name: '',
  relationship: 'Child',
  date_of_birth: '',
  nakshatra: '',
  email: '',
}

export default function MemberFamilyPage() {
  const router = useRouter()
  const { member } = useAuth()
  const supabase = createClient()

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMemberForm | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!member) return

    // Redirect if not a Personal member
    if (member.member_class !== 'Personal') {
      router.push('/member')
      return
    }

    fetchFamilyMembers()
  }, [member])

  const fetchFamilyMembers = async () => {
    if (!member) return

    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setFamilyMembers(data || [])
    } catch (error) {
      console.error('Error fetching family members:', error)
      setMessage({ type: 'error', text: 'Failed to load family members' })
    } finally {
      setLoading(false)
    }
  }

  const handleAddNew = () => {
    setEditingMember({ ...emptyForm })
    setShowForm(true)
    setMessage(null)
  }

  const handleEdit = (fm: FamilyMember) => {
    setEditingMember({
      id: fm.id,
      first_name: fm.first_name,
      last_name: fm.last_name,
      relationship: fm.relationship || 'Child',
      date_of_birth: fm.date_of_birth || '',
      nakshatra: fm.nakshatra || '',
      email: fm.email || '',
    })
    setShowForm(true)
    setMessage(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingMember(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingMember) return
    const { name, value } = e.target
    setEditingMember((prev) => prev ? { ...prev, [name]: value } : null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!member || !editingMember) return

    // Validation
    if (!editingMember.first_name.trim() || !editingMember.last_name.trim()) {
      setMessage({ type: 'error', text: 'First name and last name are required' })
      return
    }

    // Check max family members (4 children per spec)
    if (!editingMember.id && familyMembers.length >= 4) {
      setMessage({ type: 'error', text: 'Maximum of 4 family members allowed' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      if (editingMember.id) {
        // Update existing
        const { error } = await supabase
          .from('family_members')
          .update({
            first_name: editingMember.first_name.trim(),
            last_name: editingMember.last_name.trim(),
            relationship: editingMember.relationship || null,
            date_of_birth: editingMember.date_of_birth || null,
            nakshatra: editingMember.nakshatra || null,
            email: editingMember.email || null,
          })
          .eq('id', editingMember.id)

        if (error) throw error
        setMessage({ type: 'success', text: 'Family member updated successfully' })
      } else {
        // Create new
        const { error } = await supabase
          .from('family_members')
          .insert({
            member_id: member.id,
            first_name: editingMember.first_name.trim(),
            last_name: editingMember.last_name.trim(),
            relationship: editingMember.relationship || null,
            date_of_birth: editingMember.date_of_birth || null,
            nakshatra: editingMember.nakshatra || null,
            email: editingMember.email || null,
          })

        if (error) throw error
        setMessage({ type: 'success', text: 'Family member added successfully' })
      }

      // Refresh list and close form
      await fetchFamilyMembers()
      setShowForm(false)
      setEditingMember(null)
    } catch (error) {
      console.error('Error saving family member:', error)
      setMessage({ type: 'error', text: 'Failed to save. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!member) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', id)

      if (error) throw error

      setMessage({ type: 'success', text: 'Family member removed' })
      setDeleteConfirmId(null)
      await fetchFamilyMembers()
    } catch (error) {
      console.error('Error deleting family member:', error)
      setMessage({ type: 'error', text: 'Failed to remove family member' })
    } finally {
      setSaving(false)
    }
  }

  if (!member) {
    return <NoMembershipState detail="no family to manage" />
  }

  return (
    <FamilyView
      familyMembers={familyMembers}
      loading={loading}
      relationships={RELATIONSHIPS}
      nakshatras={NAKSHATRAS}
      showForm={showForm}
      /* editingMember doubles as the form state; a present id means "editing". */
      editingMember={editingMember?.id ? editingMember : null}
      formData={editingMember ?? emptyForm}
      saving={saving}
      message={message}
      deleteConfirmId={deleteConfirmId}
      onAddNew={handleAddNew}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onChange={handleInputChange}
      onSubmit={handleSubmit}
      onRequestDelete={setDeleteConfirmId}
      onConfirmDelete={handleDelete}
    />
  )
}
