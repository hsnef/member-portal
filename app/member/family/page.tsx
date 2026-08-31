'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { useAuth } from '@/lib/auth/AuthContext'
import { createClient } from '@/lib/supabase/client'
import type { FamilyMember, Nakshatra } from '@/types/database'

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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-saffron border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading family members...</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <button
              onClick={() => router.push('/member')}
              className="text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              ← Back to Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Family Members</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your family members (up to 4)
                </p>
              </div>
              {!showForm && familyMembers.length < 4 && (
                <button
                  onClick={handleAddNew}
                  className="px-4 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
                >
                  + Add Family Member
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Add/Edit Form */}
          {showForm && editingMember && (
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                {editingMember.id ? 'Edit Family Member' : 'Add Family Member'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={editingMember.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={editingMember.last_name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Relationship
                    </label>
                    <select
                      name="relationship"
                      value={editingMember.relationship}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    >
                      {RELATIONSHIPS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={editingMember.date_of_birth}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nakshatra (Birth Star)
                    </label>
                    <select
                      name="nakshatra"
                      value={editingMember.nakshatra}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    >
                      <option value="">Select Nakshatra</option>
                      {NAKSHATRAS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={editingMember.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-saffron-ring focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
                  >
                    {saving ? 'Saving...' : editingMember.id ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Family Members List */}
          {familyMembers.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Family Members Yet</h3>
              <p className="text-gray-600 mb-6">
                Add your family members to include them in your membership benefits.
              </p>
              {!showForm && (
                <button
                  onClick={handleAddNew}
                  className="px-6 py-2 bg-saffron text-white rounded-md hover:bg-saffron-hover font-semibold"
                >
                  Add Your First Family Member
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {familyMembers.map((fm) => (
                <div key={fm.id} className="bg-white shadow rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {fm.first_name} {fm.last_name}
                        </h3>
                        {fm.relationship && (
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {fm.relationship}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        {fm.date_of_birth && (
                          <div>
                            <span className="font-medium">Birthday:</span>{' '}
                            {new Date(fm.date_of_birth).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        )}
                        {fm.nakshatra && (
                          <div>
                            <span className="font-medium">Nakshatra:</span> {fm.nakshatra}
                          </div>
                        )}
                        {fm.email && (
                          <div>
                            <span className="font-medium">Email:</span> {fm.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(fm)}
                        className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      {deleteConfirmId === fm.id ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDelete(fm.id)}
                            disabled={saving}
                            className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-300"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(fm.id)}
                          className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Add More Button */}
              {!showForm && familyMembers.length < 4 && (
                <div className="text-center pt-4">
                  <button
                    onClick={handleAddNew}
                    className="text-saffron hover:text-saffron-hover font-medium"
                  >
                    + Add Another Family Member ({4 - familyMembers.length} remaining)
                  </button>
                </div>
              )}

              {familyMembers.length >= 4 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800">
                    Maximum family members reached (4). Contact the office if you need to add more.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
