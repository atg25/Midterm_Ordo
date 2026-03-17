import { useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import type { Command } from "@/core/commands/Command";
import type { MentionItem } from "@/core/entities/mentions";
import {
  createCommandMentions,
  createShellCommands,
} from "@/lib/shell/shell-commands";

export function useCommandRegistry() {
  const router = useRouter();
  const { setTheme } = useTheme();

  const commands = useMemo<Command[]>(
    () =>
      createShellCommands({
        navigate: (path) => router.push(path),
        setTheme,
      }),
    [router, setTheme],
  );

  const mentions = useMemo<MentionItem[]>(() => createCommandMentions(), []);

  const executeCommand = useCallback(
    (commandId: string) => {
      const command = commands.find((candidate) => candidate.id === commandId);
      if (!command) {
        return false;
      }

      command.execute();
      return true;
    },
    [commands],
  );

  const findCommands = useCallback(
    (query: string) => {
      const normalizedQuery = query.toLowerCase();
      return mentions.filter(
        (command) =>
          command.name.toLowerCase().includes(normalizedQuery) ||
          command.description?.toLowerCase().includes(normalizedQuery) ||
          command.id.toLowerCase().includes(normalizedQuery),
      );
    },
    [mentions],
  );

  return {
    executeCommand,
    findCommands,
  };
}
