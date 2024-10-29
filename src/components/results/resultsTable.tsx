import { FC } from 'react'
import { formatEther } from 'viem'

import { StatusBadge } from '@/components/results'

const ResultsTable: FC<{
  games: {
    gameId: bigint
    status: number
    prizePool: bigint
    numberOfWinners: bigint
    winningNumbers: bigint[]
  }[]
  onGameClick: (round: bigint) => void
}> = ({ games, onGameClick }) => {
  const formatPrizePool = (prizePool: bigint) => {
    return `${parseFloat(formatEther(prizePool)).toFixed(1)} ETH`
  }

  const formatWinningNumbers = (numbers: bigint[]) => {
    return numbers.map((n) => n.toString().padStart(2, '0')).join(' - ')
  }

  return (
    <div className='bg-white shadow-md rounded-lg overflow-hidden'>
      <div className='overflow-x-auto'>
        <table className='w-full'>
          <thead className='bg-gray-50'>
            <tr>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Round #
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Status
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Prize Pool
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Winners
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                Winning Numbers
              </th>
              <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'></th>
            </tr>
          </thead>
          <tbody className='bg-white divide-y divide-gray-200'>
            {games.map((game) => (
              <tr
                key={game.gameId.toString()}
                className='hover:bg-gray-50 transition-colors duration-150 ease-in-out'
              >
                <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                  {game.gameId.toString()}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm'>
                  <StatusBadge status={game.status} />
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {formatPrizePool(game.prizePool)}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {Number(game.winningNumbers[0]) !== 0 ? game.numberOfWinners.toString() : '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                  {Number(game.winningNumbers[0]) !== 0
                    ? formatWinningNumbers(game.winningNumbers)
                    : '-'}
                </td>
                <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                  <div
                    onClick={() => onGameClick(game.gameId)}
                    className='text-gray-600 hover:text-gray-900 cursor-pointer'
                  >
                    <svg
                      className='w-5 h-5 inline-block'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 5l7 7-7 7'
                      />
                    </svg>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ResultsTable
