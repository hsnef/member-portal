'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import type { FamilyMember, Nakshatra } from '@/types/database'

const familyMemberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  relationship: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  nakshatra: z.string().optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
})

type FamilyMemberFormData = z.infer<typeof familyMemberSchema>

const NAKSHATRAS: Nakshatra[] = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashirsha', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshta',
  'Moola', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta',
  'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'
]

interface FamilyMembersSectionProps {
  memberId: string
  familyMembers: FamilyMember[]
  onRefresh: () => void
}

export function FamilyMembersSection({ memberId, familyMembers, onRefresh }: FamilyMembersSectionProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FamilyMemberFormData>({
    resolver: zodResolver(familyMemberSchema),
  })

  const openAddModal = () => {
    reset({
      first_name: '',
      last_name: '',
      relationship: '',
      date_of_birth: '',
      nakshatra: '',
      email: '',
    })
    setEditingMember(null)
    setShowAddModal(true)
  }

  const openEditModal = (familyMember: FamilyMember) => {
    reset({
      first_name: familyMember.first_name,
      last_name: familyMember.last_name,
      relationship: familyMember.relationship || '',
      date_of_birth: familyMember.date_of_birth || '',
      nakshatra: familyMember.nakshatra || '',
      email: familyMember.email || '',
    })
    setEditingMember(familyMember)
    setShowAddModal(true)
  }

  const closeModal = () => {
    setShowAddModal(false)
    setEditingMember(null)
    setError(null)
    reset()
  }

  const onSubmit = async (data: FamilyMemberFormData) => {
    try {
      setLoading(true)
      setError(null)

      if (editingMember) {
        // Update existing family member
        const { error: updateError } = await supabase
          .from('family_members')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            relationship: data.relationship || null,
            date_of_birth: data.date_of_birth || null,
            nakshatra: (data.nakshatra as Nakshatra) || null,
            email: data.email || null,
          })
          .eq('id', editingMember.id)

        if (updateError) throw updateError
      } else {
        // Add new family member
        const { error: insertError } = await supabase
          .from('family_members')
          .insert({
            member_id: memberId,
            first_name: data.first_name,
            last_name: data.last_name,
            relationship: data.relationship || null,
            date_of_birth: data.date_of_birth || null,
            nakshatra: (data.nakshatra as Nakshatra) || null,
            email: data.email || null,
          })

        if (insertError) throw insertError
      }

      closeModal()
      onRefresh()
    } catch (err) {
      console.error('Error saving family member:', err)
      setError(err instanceof Error ? err.message : 'Failed to save family member')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (familyMemberId: string) => {
    if (!confirm('Are you sure you want to remove this family member?')) return

    try {
      const { error: deleteError } = await supabase
        .from('family_members')
        .delete()
        .eq('id', familyMemberId)

      if (deleteError) throw deleteError

      onRefresh()
    } catch (err) {
      console.error('Error deleting family member:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete family member')
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Family Members</h2>
        <button
          onClick={openAddModal}
          className="px-4 py-2 text-sm font-medium text-white bg-saffron hover:bg-saffron-hover rounded-md transition-colors"
        >
          + Add Family Member
        </button>
      </div>

      {familyMembers.length === 0 ? (
        <p className="text-gray-500 text-sm">No family members added yet.</p>
      ) : (
        <div className="space-y-4">
          {familyMembers.map((familyMember) => (
            <div
              key={familyMember.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">
                    {familyMember.first_name} {familyMember.last_name}
                  </h3>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    {familyMember.relationship && (
                      <div>
                        <span className="text-gray-500">Relationship:</span>
                        <span className="ml-2 text-gray-900">{familyMember.relationship}</span>
                      </div>
                    )}
                    {familyMember.date_of_birth && (
                      <div>
                        <span className="text-gray-500">DOB:</span>
                        <span className="ml-2 text-gray-900">
                          {new Date(familyMember.date_of_birth).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {familyMember.nakshatra && (
                      <div>
                        <span className="text-gray-500">Nakshatra:</span>
                        <span className="ml-2 text-gray-900">{familyMember.nakshatra}</span>
                      </div>
                    )}
                    {familyMember.email && (
                      <div>
                        <span className="text-gray-500">Email:</span>
                        <a
                          href={`mailto:${familyMember.email}`}
                          className="ml-2 text-saffron hover:text-saffron-hover"
                        >
                          {familyMember.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => openEditModal(familyMember)}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(familyMember.id)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </h3>

              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      {...register('first_name')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                    />
                    {errors.first_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      {...register('last_name')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                    />
                    {errors.last_name && (
                      <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship
                    </label>
                    <input
                      type="text"
                      {...register('relationship')}
                      placeholder="e.g., Son, Daughter, Spouse"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      {...register('date_of_birth')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nakshatra
                    </label>
                    <select
                      {...register('nakshatra')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                    >
                      <option value="">Select Nakshatra</option>
                      {NAKSHATRAS.map((nakshatra) => (
                        <option key={nakshatra} value={nakshatra}>
                          {nakshatra}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      {...register('email')}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-saffron focus:ring-saffron-ring"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 text-sm font-medium text-white bg-saffron hover:bg-saffron-hover rounded-md disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : editingMember ? 'Save Changes' : 'Add Family Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
