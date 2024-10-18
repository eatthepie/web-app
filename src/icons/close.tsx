import React, { type SVGProps } from 'react'

export default function Close(props: SVGProps<SVGSVGElement>) {
  return (
    <svg className='w-5 h-5' fill='none' viewBox='0 0 24 24' stroke='currentColor' {...props}>
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M6 18L18 6M6 6l12 12'
      />
    </svg>
  )
}
