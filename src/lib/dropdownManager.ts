let closeActiveFn: (() => void) | null = null

export function registerDropdown(closeFn: () => void) {
  if (closeActiveFn && closeActiveFn !== closeFn) {
    closeActiveFn()
  }
  closeActiveFn = closeFn
}

export function clearDropdown(closeFn: () => void) {
  if (closeActiveFn === closeFn) closeActiveFn = null
}
