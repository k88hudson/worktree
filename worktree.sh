worktree() {
  local output cmd
  [[ $# -lt 1 ]] && { echo "Usage: worktree <name> | worktree cleanup"; return 1; }

  if [[ "$1" == "-h" || "$1" == "--help" || "$1" == "help" ]]; then
    cat <<EOF
Usage: worktree <name> [--base <branch>]
       worktree cleanup [<name>] [--remove-branch]

A tiny wrapper around git worktree that creates worktrees as sibling
directories and cds into them.

Commands:
  <name>    Create a worktree + branch as a sibling directory
  cleanup   Remove the current worktree and cd back to the main repo

Run 'worktree <command> --help' for more info on a command.
EOF
    return 0
  fi

  if [[ "$1" == "cleanup" ]]; then
    cmd="worktree-cleanup"
    shift
  else
    cmd="worktree-add"
  fi

  output=$(git "$cmd" "$@") || { local rc=$?; echo "$output" >&2; return $rc; }
  echo "$output"
  local last_line="${output##*$'\n'}"
  if [[ -d "$last_line" ]]; then
    cd "$last_line"
  fi
}
