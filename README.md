# worktree

A tiny wrapper around `git worktree` that makes it feel like a
branch workflow by creates worktrees as sibling directories and
cding into them.

```bash
~/hello $ worktree foo
# new worktree on branch "foo", branched from main
~/hello-foo $
~/hello-foo $ worktree cleanup
# worktree removed, back in main repo
# note: the branch isn't deleted
~/hello $
```

## Install

```bash
git clone https://github.com/k88hudson/worktree.git ~/.worktree
```

Add to your `.zshrc` (or `.bashrc`):

```bash
export PATH="$HOME/.worktree:$PATH"
source "$HOME/.worktree/worktree.sh"
```

## Usage

### `worktree <name> [--base <branch>]`

Create a new worktree as a sibling directory with a matching branch name.

```bash
worktree foo              # creates ../myproject-foo on branch "foo" from main
worktree foo --base dev   # branch from "dev" instead of "main"
```

If the branch already exists, it reuses it.

### `worktree cleanup [--remove-branch]`

Remove the current worktree and cd back to the main repo. Must be run from inside a worktree. The branch is kept by default.

```bash
worktree cleanup                # removes worktree, keeps branch
worktree cleanup --remove-branch  # removes worktree and deletes the branch
```
