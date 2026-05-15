import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonRow, EmptyState } from './Skeleton';

/**
 * Reusable DataTable component built on TanStack Table v8.
 *
 * Supports:
 *  - Column sorting
 *  - Server-side OR client-side pagination
 *  - Loading skeleton rows
 *  - Empty state
 *
 * @param {object[]}  data          - row data array
 * @param {object[]}  columns       - TanStack column definitions
 * @param {boolean}   isLoading     - show skeleton rows
 * @param {number}    [pageCount]   - for server-side pagination; omit for client-side
 * @param {object}    [pagination]  - { pageIndex, pageSize } for server-side
 * @param {Function}  [onPaginate]  - callback({ pageIndex, pageSize }) for server-side
 * @param {string}    [emptyTitle]  - empty state heading
 * @param {string}    [emptyIcon]   - emoji for empty state
 */
export default function DataTable({
  data = [],
  columns = [],
  isLoading = false,
  pageCount,              // server-side: total number of pages
  pagination: externalPagination,
  onPaginate,
  emptyTitle = 'No records found',
  emptyIcon = '📋',
}) {
  const [sorting, setSorting] = useState([]);
  const [internalPagination, setInternalPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const isServerPaginated = Boolean(pageCount !== undefined && onPaginate);
  const pagination = isServerPaginated ? externalPagination : internalPagination;

  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    manualPagination: isServerPaginated,
    pageCount: isServerPaginated ? pageCount : undefined,
    onSortingChange: setSorting,
    onPaginationChange: isServerPaginated
      ? (updater) => {
          const next = typeof updater === 'function' ? updater(pagination) : updater;
          onPaginate(next);
        }
      : setInternalPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: isServerPaginated ? undefined : getPaginationRowModel(),
  });

  const colCount = columns.length;

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const canSort = header.column.getCanSort();
                  return (
                    <th
                      key={header.id}
                      className={`px-6 py-4 whitespace-nowrap ${canSort ? 'cursor-pointer select-none hover:text-slate-800' : ''}`}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      <div className="flex items-center gap-1">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort && (
                          <span className="text-slate-300 ml-1">
                            {sorted === 'asc' ? <ChevronUp size={14} /> : sorted === 'desc' ? <ChevronDown size={14} /> : <ChevronsUpDown size={14} />}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} cols={colCount} />)
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={colCount}>
                  <EmptyState title={emptyTitle} icon={emptyIcon} />
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/50">
        <p className="text-sm text-slate-500">
          Page <span className="font-bold text-slate-800">{pagination.pageIndex + 1}</span>
          {' '}of{' '}
          <span className="font-bold text-slate-800">
            {isServerPaginated ? pageCount : table.getPageCount()}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <select
            value={pagination.pageSize}
            onChange={(e) => {
              const newSize = Number(e.target.value);
              if (isServerPaginated) {
                onPaginate({ pageIndex: 0, pageSize: newSize });
              } else {
                table.setPageSize(newSize);
              }
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none"
          >
            {[10, 20, 50].map((size) => (
              <option key={size} value={size}>{size} / page</option>
            ))}
          </select>

          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
