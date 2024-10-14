import React, { useCallback, useEffect, useState } from 'react'
import Modal from 'react-modal'
import { animated, useSpring } from 'react-spring'
import { useModal } from 'connectkit'
import { ContractFunctionExecutionError, parseEther } from 'viem'
import { useAccount, usePublicClient, useWriteContract } from 'wagmi'

import { Countdown } from '@/components'
import lotteryABI from '@/contracts/LotteryABI.json'
import { useIsMobile, useLotteryInfo, useTicketInfo } from '@/hooks'
import { Calculator, Close, EthereumCircle, TicketAlternative, Timer } from '@/icons'
import { useToast } from '@/providers/ToastProvider'
import { getModalStyles } from '@/styles'
import { LOTTERY_NUMBERS_RANGE } from '@/utils/constants'

interface GameModalProps {
  onRequestClose: () => void
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LOTTERY_ADDRESS as `0x${string}`

const Game: React.FC<GameModalProps> = ({ onRequestClose }) => {
  const isMobile = useIsMobile()
  const customStyles = getModalStyles(isMobile)
  const { showToast } = useToast()

  const { open, setOpen } = useModal()
  const { address, isConnected } = useAccount()
  const { lotteryInfo } = useLotteryInfo()
  const { ticketCount: purchasedTickets } = useTicketInfo(lotteryInfo?.gameNumber ?? 0)

  const publicClient = usePublicClient()

  const [ticketCount, setTicketCount] = useState(1)
  const [isAutoGenerated, setIsAutoGenerated] = useState(true)
  const [manualNumbers, setManualNumbers] = useState<number[][]>([])
  const [isInfoCollapsed, setIsInfoCollapsed] = useState(true)

  const { writeContract, status: transactionStatus, reset, error } = useWriteContract()

  const difficulty = (lotteryInfo?.difficulty || 'Easy') as keyof typeof LOTTERY_NUMBERS_RANGE
  const numberRange = LOTTERY_NUMBERS_RANGE[difficulty]

  useEffect(() => {
    setManualNumbers(Array(ticketCount).fill(Array(4).fill(0)))
  }, [ticketCount])

  const generateRandomNumbers = () => {
    return [
      Math.floor(Math.random() * (numberRange.max - numberRange.min + 1)) + numberRange.min,
      Math.floor(Math.random() * (numberRange.max - numberRange.min + 1)) + numberRange.min,
      Math.floor(Math.random() * (numberRange.max - numberRange.min + 1)) + numberRange.min,
      Math.floor(Math.random() * (numberRange.etherball_max - numberRange.min + 1)) +
        numberRange.min,
    ]
  }

  const handleTicketCountChange = (value: string) => {
    const count = parseInt(value)
    if (!isNaN(count) && count >= 1 && count <= 100) {
      setTicketCount(count)
    }
  }

  const handleNumberChange = (ticketIndex: number, numberIndex: number, value: number) => {
    const newManualNumbers = [...manualNumbers]
    newManualNumbers[ticketIndex] = [...newManualNumbers[ticketIndex]]
    newManualNumbers[ticketIndex][numberIndex] = value
    setManualNumbers(newManualNumbers)
  }

  const handlePurchase = useCallback(async () => {
    if (!lotteryInfo?.ticketPrice || !address || !publicClient) return

    const ticketPrice = Number(lotteryInfo.ticketPrice)
    const value = parseEther((ticketPrice * ticketCount).toString())

    const tickets = isAutoGenerated
      ? Array(ticketCount)
          .fill(0)
          .map(() => generateRandomNumbers())
      : manualNumbers

    console.log('value', value)
    try {
      const { request } = await publicClient.simulateContract({
        address: CONTRACT_ADDRESS,
        abi: lotteryABI,
        functionName: 'buyTickets',
        args: [tickets],
        value,
        account: address,
      })
      writeContract(request)
    } catch (err) {
      console.log('error hits here?', err)

      if (err instanceof ContractFunctionExecutionError) {
        const errorMessage = err.message.toLowerCase()
        console.log('error msg', errorMessage)
        if (errorMessage.includes('invalid numbers')) {
          showToast('⚠️ Invalid ticket numbers', 2500)
        } else if (errorMessage.includes('insufficient funds')) {
          showToast('⚠️ insufficient funds', 2500)
        } else if (errorMessage.includes('ticket count')) {
          showToast('⚠️ Max 100 tickets per purchase', 2500)
        } else {
          showToast('⚠️ Transaction failed. Please try again', 2500)
        }
      } else {
        showToast('⚠️ Transaction failed. Please try again', 2500)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    address,
    lotteryInfo,
    isAutoGenerated,
    manualNumbers,
    publicClient,
    ticketCount,
    writeContract,
  ])

  const renderNumberInputs = () => {
    return manualNumbers.map((ticket, ticketIndex) => (
      <div key={ticketIndex} className='bg-gray-100 p-4 rounded-lg mb-4'>
        <h4 className='text-sm font-semibold mb-2'>Ticket {ticketIndex + 1}</h4>
        <div className='grid grid-cols-4 gap-2'>
          {ticket.map((number, numberIndex) => (
            <input
              key={numberIndex}
              type='number'
              min={numberRange.min}
              max={numberIndex === 3 ? numberRange.etherball_max : numberRange.max}
              value={number || ''}
              onChange={(e) =>
                handleNumberChange(ticketIndex, numberIndex, parseInt(e.target.value))
              }
              className='w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              placeholder={`${numberRange.min}-${numberIndex === 3 ? numberRange.etherball_max : numberRange.max}`}
            />
          ))}
        </div>
      </div>
    ))
  }

  const buttonAnimation = useSpring({
    scale: transactionStatus === 'pending' ? 1.05 : 1,
    config: { tension: 300, friction: 10 },
  })

  const fadeIn = useSpring({
    opacity: transactionStatus !== 'idle' ? 1 : 0,
    config: { duration: 200 },
  })

  const renderTransactionFeedback = () => {
    switch (transactionStatus) {
      case 'pending':
        return (
          <animated.div
            style={fadeIn}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          >
            <div className='bg-white p-6 rounded-lg text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
              <p className='text-xl font-bold'>Purchasing your tickets</p>
              <p>Hold on tight, luck is on its way!</p>
            </div>
          </animated.div>
        )
      case 'success':
        return (
          <animated.div
            style={fadeIn}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          >
            <div className='bg-white p-6 rounded-lg text-center'>
              <div className='text-5xl mb-4'>🎟️</div>
              <p className='text-2xl font-bold mb-2'>Tickets Secured!</p>
              <p className='text-xl mb-4'>You're officially in the game.</p>
              <p>May fortune smile upon you!</p>
              <button
                onClick={onRequestClose}
                className='mt-4 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200'
              >
                Back to Game
              </button>
            </div>
          </animated.div>
        )
      case 'error':
        return (
          <animated.div
            style={fadeIn}
            className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          >
            <div className='bg-white p-6 rounded-lg text-center'>
              <div className='text-5xl mb-4'>😕</div>
              <p className='text-xl font-bold mb-2'>Oops! A slight hiccup.</p>
              <p>
                {error?.message ||
                  "We couldn't process your ticket purchase. Want to try again?"}
              </p>
              <button
                onClick={() => reset()}
                className='mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200'
              >
                Give it Another Shot
              </button>
            </div>
          </animated.div>
        )
      default:
        return null
    }
  }

  return (
    <Modal
      id='react-modal'
      ariaHideApp={false}
      isOpen={true}
      onRequestClose={onRequestClose}
      style={customStyles}
    >
      <div className='flex flex-col h-full overflow-hidden'>
        <div className='p-6 flex-shrink-0 border-b border-gray-200'>
          <div className='flex justify-between items-center'>
            <h2 className='text-2xl font-bold text-gray-800'>
              Buy Tickets - Round #{lotteryInfo?.gameNumber}
            </h2>
            <button
              onClick={onRequestClose}
              className='text-gray-400 hover:text-gray-600 transition-colors'
            >
              <Close className='w-6 h-6' />
            </button>
          </div>
        </div>

        <div className='flex-grow overflow-y-auto px-6 py-4'>
          <div className='mb-6'>
            <button
              onClick={() => setIsInfoCollapsed(!isInfoCollapsed)}
              className='w-full flex items-center justify-between py-5 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors'
            >
              <span className='font-semibold text-gray-800'>Game Information</span>
              <svg
                className={`w-5 h-5 transform transition-transform ${
                  isInfoCollapsed ? 'rotate-180' : ''
                }`}
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M19 9l-7 7-7-7'
                />
              </svg>
            </button>
          </div>

          {!isInfoCollapsed && (
            <div className='grid grid-cols-2 gap-4 mb-6'>
              <div className='bg-sky-50 border border-sky-100 rounded-lg p-4 flex items-center'>
                <Timer className='w-10 h-10 text-sky-600 mr-3' />
                <div>
                  <h3 className='text-sm font-semibold text-sky-700'>Countdown</h3>
                  <div className='text-xl font-bold text-sky-800'>
                    <Countdown secondsUntilDraw={lotteryInfo?.secondsUntilDraw} />
                  </div>
                </div>
              </div>
              <div className='bg-emerald-50 border border-emerald-100 rounded-lg p-4 flex items-center'>
                <EthereumCircle className='w-10 h-10 text-emerald-600 mr-3' />
                <div>
                  <h3 className='text-sm font-semibold text-emerald-700'>Prize Pool</h3>
                  <p className='text-xl font-bold text-emerald-800'>{`${lotteryInfo?.prizePool || '0'} ETH`}</p>
                </div>
              </div>
              <div className='bg-amber-50 border border-amber-100 rounded-lg p-4 flex items-center'>
                <Calculator className='w-10 h-10 text-amber-600 mr-3' />
                <div>
                  <h3 className='text-sm font-semibold text-amber-700'>Difficulty</h3>
                  <p className='text-xl font-bold text-amber-800'>
                    {lotteryInfo?.difficulty || '-'}
                  </p>
                </div>
              </div>
              <div className='bg-violet-50 border border-violet-100 rounded-lg p-4 flex items-center'>
                <TicketAlternative className='w-10 h-10 text-violet-600 mr-3' />
                <div>
                  <h3 className='text-sm font-semibold text-violet-700'>Your Tickets</h3>
                  <p className='text-xl font-bold text-violet-800'>{purchasedTickets}</p>
                </div>
              </div>
            </div>
          )}

          <div className='space-y-6'>
            <div className='flex bg-gray-100 p-4 rounded-lg'>
              <div className='flex flex-col'>
                <div className='flex items-center'>
                  <TicketAlternative className='w-6 h-6 mr-2 text-gray-600' />
                  <span className='font-semibold text-gray-700'>Number of tickets:</span>
                </div>
                <p className='text-sm text-gray-500 italic'>Max 100 tickets per purchase</p>
              </div>
              <input
                type='number'
                min='1'
                max='100'
                value={ticketCount}
                onChange={(e) => handleTicketCountChange(e.target.value)}
                className='ml-auto w-20 px-3 py-2 text-center border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>
            <div className='flex items-center justify-between bg-gray-100 p-4 rounded-lg'>
              <div className='flex items-center'>
                <svg
                  className='w-6 h-6 mr-2 text-gray-600'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z' />
                </svg>
                <span className='font-semibold text-gray-700'>Auto-generate numbers:</span>
              </div>
              <label className='flex items-center cursor-pointer'>
                <div className='relative'>
                  <input
                    type='checkbox'
                    className='sr-only'
                    checked={isAutoGenerated}
                    onChange={() => setIsAutoGenerated(!isAutoGenerated)}
                  />
                  <div
                    className={`block w-14 h-8 rounded-full transition-colors duration-300 ease-in-out ${
                      isAutoGenerated ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  ></div>
                  <div
                    className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ease-in-out ${
                      isAutoGenerated ? 'transform translate-x-6' : ''
                    }`}
                  ></div>
                </div>
              </label>
            </div>
            {!isAutoGenerated && renderNumberInputs()}
          </div>
        </div>

        <div className='p-6 flex-shrink-0 border-t border-gray-200'>
          <div className='mb-4 text-center'>
            <span className='text-lg font-semibold text-gray-700'>
              Total cost: {(ticketCount * Number(lotteryInfo?.ticketPrice || 0)).toFixed(2)} ETH
            </span>
          </div>
          <animated.button
            style={buttonAnimation}
            onClick={() => {
              !isConnected ? setOpen(true) : handlePurchase()
            }}
            disabled={transactionStatus === 'pending'}
            className='w-full py-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold text-xl rounded-lg hover:from-green-500 hover:to-blue-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {!isConnected ? (
              <>Connect Wallet</>
            ) : (
              <>{transactionStatus === 'pending' ? 'Processing...' : 'Purchase Tickets'}</>
            )}
          </animated.button>
        </div>
      </div>
      {renderTransactionFeedback()}
    </Modal>
  )
}

export default Game
