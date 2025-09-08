'use client'

import { useQuery } from '@tanstack/react-query'

type Role = 'user' | 'advertiser' | null

async function fetchUserMe() {
  const res = await fetch('/api/user/me', { credentials: 'include' })
  if (!res.ok) throw new Error('user not authenticated')
  return res.json() as Promise<unknown>
}

async function fetchAdvertiserMe() {
  const res = await fetch('/api/advertiser/me', { credentials: 'include' })
  if (!res.ok) throw new Error('advertiser not authenticated')
  return res.json() as Promise<unknown>
}

export function useRole() {
  const userQuery = useQuery({
    queryKey: ['me', 'user'],
    queryFn: fetchUserMe,
    retry: false,
  })

  const advertiserQuery = useQuery({
    queryKey: ['me', 'advertiser'],
    queryFn: fetchAdvertiserMe,
    retry: false,
  })

  const isLoading = userQuery.isLoading || advertiserQuery.isLoading

  let role: Role = null
  if (advertiserQuery.isSuccess) role = 'advertiser'
  else if (userQuery.isSuccess) role = 'user'

  return { role, isLoading }
}


