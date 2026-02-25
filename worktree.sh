worktree() {
  local output cmd
  [[ $# -lt 1 ]] && { echo "Usage: worktree <name> | worktree cleanup"; return 1; }

  if [[ "$1" == "cleanup" ]]; then
    cmd="worktree-cleanup"
    shift
  else
    cmd="worktree-add"
  fi

  output=$(git "$cmd" "$@") || { echo "$output" >&2; return $?; }
  echo "$output"
  local last_line="${output##*$'\n'}"
  if [[ -d "$last_line" ]]; then
    cd "$last_line"
  fi
}
