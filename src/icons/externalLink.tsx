import React, { type SVGProps } from 'react'

export default function ExternalLink(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      className='h-4 w-4 ml-1'
      fill='none'
      viewBox='0 0 24 24'
      stroke='currentColor'
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14'
      />
    </svg>
  )
}
