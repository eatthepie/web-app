'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { formatEther } from 'viem'

import { GameSection } from '@/components/results'
import { useLotteryGameInfo } from '@/hooks'
import { Copy } from '@/icons'
import { useToast } from '@/providers/ToastProvider'
import { truncateString } from '@/utils/helpers'
import { GameDetailedInfo } from '@/utils/types'

const GameProgressSection = ({ gameInfo }: { gameInfo: GameDetailedInfo }) => {
  const steps = [
    { label: 'Game Started', completed: true },
    { label: 'Drawing Initiated', completed: gameInfo.drawInitiatedBlock > 0n },
    { label: 'RANDAO Set', completed: gameInfo.randaoBlock > 0n },
  ]

  const status = steps.every((step) => step.completed)
    ? 'completed'
    : steps.some((step) => step.completed)
      ? 'inProgress'
      : 'pending'

  return (
    <GameSection title='Game Progress' emoji='📈' status={status}>
      <div className='relative'>
        <div className='absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200' />
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className='relative flex items-center mb-8 last:mb-0'
          >
            <div
              className={`absolute left-4 w-7 h-7 rounded-full flex items-center justify-center border-2 -ml-3.5 ${
                step.completed ? 'bg-green-500 border-green-400' : 'bg-white border-gray-300'
              }`}
            >
              {step.completed ? (
                <svg
                  className='w-4 h-4 text-white'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              ) : (
                <div className='w-2 h-2 bg-gray-300 rounded-full' />
              )}
            </div>
            <div className='ml-11'>
              <h4
                className={`text-sm font-semibold ${
                  step.completed ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {step.label}
              </h4>
            </div>
          </motion.div>
        ))}
      </div>
    </GameSection>
  )
}

const RandomNumberSection = ({
  gameInfo,
  showToast,
}: {
  gameInfo: GameDetailedInfo
  showToast: (message: string, duration?: number) => void
}) => {
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('✅ RANDAO value copied')
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        showToast('✅ RANDAO value copied')
      } catch (err) {
        console.error('Failed to copy RANDAO value:', text)
        showToast('⚠️ Error copying RANDAO value')
      }
      document.body.removeChild(textArea)
    }
  }

  const vdfSubmitted = gameInfo.winningNumbers[0] !== 0n
  const randaoBlock = gameInfo.randaoBlock !== 0n ? gameInfo.randaoBlock.toString() : '-'
  const randaoValue = gameInfo.randaoValue !== 0n ? gameInfo.randaoValue.toString() : '-'

  const status = vdfSubmitted
    ? 'completed'
    : gameInfo.drawInitiatedBlock > 0n
      ? 'inProgress'
      : 'pending'

  return (
    <GameSection title='Random Number Generation' emoji='🎲' status={status} className=''>
      <div className='space-y-3'>
        <div className='p-3 bg-gray-50 rounded'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-900'>Block Number</span>
            <span className='font-mono text-sm text-blue-600 font-medium'>{randaoBlock}</span>
          </div>
        </div>
        <div className='p-3 bg-gray-50 rounded'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-900'>RANDAO Value</span>
            <div className='flex items-center gap-2'>
              <span className='font-mono text-sm text-blue-600 font-medium'>
                {randaoValue !== '-' ? truncateString(randaoValue, 15) : '-'}
              </span>
              {randaoValue !== '-' && (
                <button
                  onClick={() => copyToClipboard(randaoValue)}
                  className='text-gray-500 hover:text-gray-700 transition-colors'
                  title='Copy full value'
                >
                  <Copy className='w-4 h-4' />
                </button>
              )}
            </div>
          </div>
        </div>
        <div className='p-3 bg-gray-50 rounded'>
          <div className='flex justify-between items-center'>
            <span className='text-sm font-medium text-gray-900'>VDF Proof</span>
            {randaoBlock === '-' && randaoValue === '-' && (
              <span className='font-mono text-sm text-blue-600 font-medium'>-</span>
            )}
            {randaoBlock !== '-' && randaoValue !== '-' && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  vdfSubmitted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {vdfSubmitted ? 'Submitted' : 'Waiting'}
              </span>
            )}
          </div>
        </div>
      </div>
    </GameSection>
  )
}

const GameInformationSection = ({ gameInfo }: { gameInfo: GameDetailedInfo }) => {
  const status =
    gameInfo.status === 2 ? 'completed' : gameInfo.status === 1 ? 'inProgress' : 'pending'

  return (
    <GameSection title='Game Information' emoji='ℹ️' status={status}>
      <div className='space-y-6'>
        {/* Top Stats Grid */}
        <div className='grid grid-cols-2 gap-4'>
          {/* Game Numbers Card */}
          <div className='col-span-2 bg-gray-50 p-4 rounded-lg'>
            <div className='space-y-1'>
              <h3 className='text-sm font-medium text-gray-500 mb-2'>Winning Numbers</h3>
              <div className='flex space-x-2'>
                {gameInfo.winningNumbers.map((number: bigint, index: number) => (
                  <div
                    key={index}
                    className='w-10 h-10 rounded-lg flex items-center justify-center 
                             bg-white text-gray-900 border border-gray-200 font-bold text-lg'
                  >
                    {gameInfo.status === 2 ? number.toString().padStart(2, '0') : '-'}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Total Prize Card */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <div className='flex items-center justify-between h-full'>
              <div className='space-y-1'>
                <h3 className='text-sm font-medium text-gray-500'>Total Prize</h3>
                <div className='flex items-baseline space-x-1'>
                  <span className='text-2xl font-bold text-gray-900'>
                    {Number(formatEther(gameInfo.prizePool)).toFixed(2)}
                  </span>
                  <span className='text-lg font-semibold text-gray-600'>ETH</span>
                </div>
              </div>
              <div className='text-2xl'>💰</div>
            </div>
          </div>

          {/* Total Winners Card */}
          <div className='bg-gray-50 p-4 rounded-lg'>
            <div className='flex items-center justify-between h-full'>
              <div className='space-y-1'>
                <h3 className='text-sm font-medium text-gray-500'>Total Winners</h3>
                <div className='flex items-baseline space-x-1'>
                  <span className='text-2xl font-bold text-gray-900'>
                    {gameInfo.status === 2 ? gameInfo.numberOfWinners.toString() : '-'}
                  </span>
                </div>
              </div>
              <div className='text-2xl'>👑</div>
            </div>
          </div>
        </div>

        {/* Prize Distribution */}
        <div className='space-y-2'>
          <h3 className='text-sm font-medium text-gray-500 mb-3'>Prize Distribution</h3>
          {[
            {
              type: 'gold',
              icon: '🏆',
              title: 'Jackpot',
              subtitle: '4 matching numbers',
              winners: gameInfo.goldWinners?.toString() || '0',
              prize:
                gameInfo.payouts[0] !== 0n
                  ? Number(formatEther(gameInfo.payouts[0])).toFixed + ' ETH'
                  : '-',
            },
            {
              type: 'silver',
              icon: '🥈',
              title: 'Silver Prize',
              subtitle: '3 in-a-row',
              winners: gameInfo.silverWinners?.toString() || '0',
              prize:
                gameInfo.payouts[1] !== 0n
                  ? Number(formatEther(gameInfo.payouts[1])).toFixed(2) + ' ETH'
                  : '-',
            },
            {
              type: 'bronze',
              icon: '🥉',
              title: 'Bronze Prize',
              subtitle: '2 in-a-row',
              winners: gameInfo.bronzeWinners?.toString() || '0',
              prize:
                gameInfo.payouts[2] !== 0n
                  ? Number(formatEther(gameInfo.payouts[2])).toFixed(2) + ' ETH'
                  : '-',
            },
          ].map((tier) => (
            <div
              key={tier.type}
              className='p-4 bg-gray-50 rounded-lg flex items-center justify-between hover:bg-gray-100 transition-colors duration-200'
            >
              <div className='flex items-center space-x-3'>
                <span className='text-2xl'>{tier.icon}</span>
                <div className='space-y-0.5'>
                  <div className='font-semibold text-gray-900'>{tier.title}</div>
                  <div className='text-sm text-gray-500'>{tier.subtitle}</div>
                  {gameInfo.status === 2 && (
                    <div className='text-sm font-medium text-blue-600'>
                      {tier.winners} winner{tier.winners !== '1' ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
              <div className='text-right'>
                <div className='font-bold text-gray-900'>{tier.prize}</div>
                <div className='text-sm text-gray-500'>per winner</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </GameSection>
  )
}

const GameDetailsPage = () => {
  const searchParams = useSearchParams()
  const round = BigInt(searchParams.get('round') || '0')
  const { showToast } = useToast()
  const { gameInfo, isLoading, isError } = useLotteryGameInfo(round)

  if (isLoading)
    return (
      <div className='flex items-center justify-center py-10'>
        <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500'></div>
        <span className='ml-2 text-sm text-gray-600'>Loading...</span>
      </div>
    )
  if (isError)
    return <div className='text-center py-10 text-red-600'>Error fetching game details</div>
  if (!gameInfo) return <div className='text-center py-10'>No game information available</div>

  return (
    <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10'>
      <h1 className='text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3'>
        <span>Game #{round.toString()}</span>
      </h1>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-5 mb-5'>
        <div className='space-y-5'>
          <GameProgressSection gameInfo={gameInfo} />
          <RandomNumberSection gameInfo={gameInfo} showToast={showToast} />
        </div>
        <GameInformationSection gameInfo={gameInfo} />
      </div>
    </div>
  )
}

export default GameDetailsPage
