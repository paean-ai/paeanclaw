import { allTools, callTool, type ToolDef } from './mcp.js';

export interface LlmConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

interface ChatMessage {
  role: string;
  content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface Delta {
  content?: string;
  tool_calls?: { index: number; id?: string; function?: { name?: string; arguments?: string } }[];
}

export type AgentEvent =
  | { type: 'content'; text: string }
  | { type: 'tool_call'; name: string; args: string }
  | { type: 'tool_result'; name: string; result: string }
  | { type: 'done'; content: string }
  | { type: 'error'; error: string };

async function* streamChat(config: LlmConfig, messages: ChatMessage[], tools: ToolDef[]): AsyncGenerator<Delta> {
  const url = `${config.baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body: Record<string, unknown> = {
    model: config.model, messages, stream: true,
  };
  if (tools.length > 0) body.tools = tools;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`LLM API error: ${res.status} ${await res.text()}`);
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;
      try {
        const chunk = JSON.parse(trimmed.slice(6));
        const delta = chunk.choices?.[0]?.delta as Delta | undefined;
        if (delta) yield delta;
      } catch { /* skip malformed chunks */ }
    }
  }
}

export async function* runAgent(
  config: LlmConfig,
  systemPrompt: string,
  history: ChatMessage[],
): AsyncGenerator<AgentEvent> {
  const tools = allTools();
  const messages: ChatMessage[] = [{ role: 'system', content: systemPrompt }, ...history];
  let fullContent = '';

  for (let turn = 0; turn < 20; turn++) {
    let content = '';
    const toolCallsMap = new Map<number, { id: string; name: string; args: string }>();

    for await (const delta of streamChat(config, messages, tools)) {
      if (delta.content) {
        content += delta.content;
        yield { type: 'content', text: delta.content };
      }
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const existing = toolCallsMap.get(tc.index);
          if (!existing) {
            toolCallsMap.set(tc.index, { id: tc.id ?? '', name: tc.function?.name ?? '', args: tc.function?.arguments ?? '' });
          } else {
            if (tc.id) existing.id = tc.id;
            if (tc.function?.name) existing.name += tc.function.name;
            if (tc.function?.arguments) existing.args += tc.function.arguments;
          }
        }
      }
    }

    const toolCalls = Array.from(toolCallsMap.values());
    if (toolCalls.length === 0) {
      fullContent += content;
      yield { type: 'done', content: fullContent };
      return;
    }

    messages.push({
      role: 'assistant', content: content || undefined,
      tool_calls: toolCalls.map(tc => ({ id: tc.id, type: 'function', function: { name: tc.name, arguments: tc.args } })),
    });
    fullContent += content;

    for (const tc of toolCalls) {
      yield { type: 'tool_call', name: tc.name, args: tc.args };
      let result: string;
      try {
        const args = JSON.parse(tc.args);
        result = await callTool(tc.name, args);
      } catch (e) {
        result = `Error: ${e instanceof Error ? e.message : String(e)}`;
      }
      yield { type: 'tool_result', name: tc.name, result };
      messages.push({ role: 'tool', tool_call_id: tc.id, content: result });
    }
  }

  yield { type: 'error', error: 'Maximum tool-calling turns exceeded' };
}
