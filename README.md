# worktree

A tiny wrapper around `git worktree` that makes it feel like a
branch workflow by creates worktrees as sibling directories and
cding into them.

```bash
worktree branchname
worktree cleanup branchname
```

## Example workflow

```bash
~/myproject $ worktree alt
# new worktree on branch "alt", branched from main
~/myproject-alt $
# do some stuff...
~/myproject-alt $ git rebase main
~/myproject $ git merge alt
~/myproject $ worktree cleanup alt
# worktree removed
# note: the branch isn't deleted
~/myproject $
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

### `worktree cleanup [<name>] [--remove-branch]`

Remove a worktree and cd back to the main repo. If `<name>` is given, removes the worktree with that branch name from anywhere. Otherwise, must be run from inside a worktree. The branch is kept by default.

```bash
worktree cleanup                      # removes current worktree, keeps branch
worktree cleanup alt                  # removes the "alt" worktree by name
worktree cleanup --remove-branch      # removes worktree and deletes the branch
worktree cleanup alt --remove-branch  # removes "alt" worktree and deletes the branch
```
