# Claim Next Task

Arguments: $ARGUMENTS (agent ID — ARCH, FE, BE, QA, DEVOPS)

Read docs/planning/task-board.md.
Find the highest-priority TODO task for the agent specified in $ARGUMENTS where all dependencies are DONE.
Update that task's status from TODO to IN_PROGRESS [$ARGUMENTS].
Write the updated task-board.md.
Report: "Claimed task [TASK-ID]: [task name] for agent [$ARGUMENTS]"