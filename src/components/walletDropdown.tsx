'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useDisconnect } from 'wagmi'

import { Cart, PowerOff, Prize, Wallet } from '@/icons'
import { trimAddress } from '@/utils/helpers'

const DropdownItem: React.FC<{
  onClick: () => void
  icon: React.ReactNode
  text: string
}> = ({ onClick, icon, text }) => (
  <button
    onClick={onClick}
    className='flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100'
    role='menuitem'
  >
    {icon}
    {text}
  </button>
)

const useClickOutside = (ref: React.RefObject<HTMLElement>, handler: () => void) => {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [ref, handler])
}

const useDropdownActions = (purchaseTicket: () => void | Promise<void>) => {
  const router = useRouter()
  const { disconnect } = useDisconnect()
  const { address } = useAccount()

  return useCallback(
    (
      closeDropdown: () => void,
    ): {
      id: string
      icon: React.ReactNode
      text: string
      action: (closeDropdown: () => void) => void
    }[] => [
      {
        id: 'buy-tickets',
        icon: <Cart />,
        text: 'Buy Tickets',
        action: () => {
          purchaseTicket()
          closeDropdown()
        },
      },
      {
        id: 'claim-prize',
        icon: <Prize />,
        text: 'Did I Win',
        action: () => {
          router.push(`/claim`)
          closeDropdown()
        },
      },
      {
        id: 'disconnect',
        icon: <PowerOff />,
        text: 'Disconnect',
        action: () => {
          disconnect()
          closeDropdown()
        },
      },
    ],
    [purchaseTicket, router, disconnect],
  )
}

const WalletDropdown: React.FC<{ purchaseTicket: () => void | Promise<void> }> = ({
  purchaseTicket,
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { address } = useAccount()
  const getDropdownActions = useDropdownActions(purchaseTicket)
  const handleClose = useCallback(() => setIsOpen(false), [])
  useClickOutside(dropdownRef, handleClose)
  const dropdownActions = getDropdownActions(handleClose)

  return (
    <div className='relative' ref={dropdownRef}>
      <button
        className='flex px-3 py-1.5 md:px-4 md:py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors duration-200 font-semibold'
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup='true'
      >
        <Wallet className='w-6 h-6 text-white' />
        <div className='ml-2'>{address ? trimAddress(address) : ''}</div>
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5'>
          <div
            className='py-1'
            role='menu'
            aria-orientation='vertical'
            aria-labelledby='wallet-menu'
          >
            {dropdownActions.map(({ id, icon, text, action }) => (
              <DropdownItem
                key={id}
                icon={icon}
                text={text}
                onClick={() => action(handleClose)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletDropdown
