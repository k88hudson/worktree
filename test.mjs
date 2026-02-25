import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, resolve } from "node:path";
import { realpathSync } from "node:fs";
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);
const PATH = `${SCRIPT_DIR}:${process.env.PATH}`;

let tmp, repo;

function git(args, { cwd = repo, env: extraEnv } = {}) {
  const env = { ...process.env, PATH, ...extraEnv };
  // Unset git env vars that leak from hooks and interfere with test repos
  delete env.GIT_DIR;
  delete env.GIT_INDEX_FILE;
  delete env.GIT_WORK_TREE;
  delete env.GIT_OBJECT_DIRECTORY;
  delete env.GIT_ALTERNATE_OBJECT_DIRECTORIES;
  return execFileSync("git", args, { cwd, env, encoding: "utf-8" }).trim();
}

function gitMayFail(args, opts) {
  try {
    return { stdout: git(args, opts), exitCode: 0 };
  } catch (e) {
    return { stdout: e.stdout?.trim(), stderr: e.stderr?.trim(), exitCode: e.status };
  }
}

describe("worktree", () => {
  beforeEach(() => {
    tmp = realpathSync(mkdtempSync(join(tmpdir(), "worktree-test-")));
    repo = join(tmp, "myproject");
    execFileSync("mkdir", ["-p", repo]);
    git(["init", "-b", "main"]);
    git(["commit", "--allow-empty", "-m", "initial"]);
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  describe("git worktree-add", () => {
    test("creates a sibling directory with the correct branch", () => {
      const output = git(["worktree-add", "feat"]);
      const wtPath = join(tmp, "myproject-feat");

      assert.ok(existsSync(wtPath));
      assert.ok(output.endsWith(wtPath), "last line should be the worktree path");

      const branch = git(["rev-parse", "--abbrev-ref", "HEAD"], { cwd: wtPath });
      assert.equal(branch, "feat");
    });

    test("--base uses the specified branch", () => {
      git(["branch", "dev"]);
      git(["commit", "--allow-empty", "-m", "after dev"]);

      git(["worktree-add", "from-dev", "--base", "dev"]);
      const wtPath = join(tmp, "myproject-from-dev");

      const devSha = git(["rev-parse", "dev"]);
      const wtSha = git(["rev-parse", "HEAD"], { cwd: wtPath });
      assert.equal(wtSha, devSha);
    });

    test("reuses an existing branch", () => {
      git(["worktree-add", "feat"]);
      git(["worktree", "remove", join(tmp, "myproject-feat")]);

      const output = git(["worktree-add", "feat"]);
      assert.ok(output.includes("already exists"));
      assert.ok(existsSync(join(tmp, "myproject-feat")));
    });

    test("fails with no arguments", () => {
      const { exitCode } = gitMayFail(["worktree-add"]);
      assert.notEqual(exitCode, 0);
    });

    test("fails outside a git repo", () => {
      const { exitCode } = gitMayFail(["worktree-add", "nope"], { cwd: tmpdir() });
      assert.notEqual(exitCode, 0);
    });
  });

  describe("git worktree-cleanup", () => {
    test("cleanup by name removes the directory but keeps the branch", () => {
      git(["worktree-add", "feat"]);
      git(["worktree-cleanup", "feat"]);

      assert.ok(!existsSync(join(tmp, "myproject-feat")));
      // branch should still exist
      const { exitCode } = gitMayFail(["show-ref", "--verify", "refs/heads/feat"]);
      assert.equal(exitCode, 0);
    });

    test("cleanup --remove-branch deletes the branch", () => {
      git(["worktree-add", "alt"]);
      git(["worktree-cleanup", "alt", "--remove-branch"]);

      assert.ok(!existsSync(join(tmp, "myproject-alt")));
      const { exitCode } = gitMayFail(["show-ref", "--verify", "refs/heads/alt"]);
      assert.notEqual(exitCode, 0);
    });

    test("cleanup current worktree (no name) from inside it", () => {
      git(["worktree-add", "current"]);
      const wtPath = join(tmp, "myproject-current");

      const output = git(["worktree-cleanup"], { cwd: wtPath });
      const lastLine = output.split("\n").pop();

      assert.ok(!existsSync(wtPath));
      assert.equal(lastLine, repo);
    });

    test("cleanup fails from main repo without a name", () => {
      const { exitCode } = gitMayFail(["worktree-cleanup"]);
      assert.notEqual(exitCode, 0);
    });

    test("cleanup fails for nonexistent worktree", () => {
      const { exitCode } = gitMayFail(["worktree-cleanup", "nonexistent"]);
      assert.notEqual(exitCode, 0);
    });

    test("cleanup by name works from inside another worktree", () => {
      git(["worktree-add", "wt-a"]);
      git(["worktree-add", "wt-b"]);

      git(["worktree-cleanup", "wt-b"], { cwd: join(tmp, "myproject-wt-a") });
      assert.ok(!existsSync(join(tmp, "myproject-wt-b")));
    });
  });
});
