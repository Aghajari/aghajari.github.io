export type Lang = "kotlin" | "c" | "asm" | "glsl";

type Rule = { type: string; re: RegExp };

const RULES: Record<Lang, Rule[]> = {
  kotlin: [
    { type: "comment", re: /\/\/[^\n]*/g },
    { type: "comment", re: /\/\*[\s\S]*?\*\//g },
    { type: "string", re: /"(?:\\.|[^"\\])*"/g },
    { type: "string", re: /'(?:\\.|[^'\\])*'/g },
    { type: "annotation", re: /@\w+/g },
    { type: "number", re: /\b\d+(?:\.\d+)?(?:f|L)?\b/g },
    {
      type: "keyword",
      re: /\b(?:fun|val|var|class|object|suspend|return|if|else|when|for|while|true|false|null|private|public|override|data|enum|sealed|inline|companion|init|this|super|is|as|in|import|package|interface|abstract|try|catch|finally|throw|lazy|get|set|by|repeat|open|internal|protected|crossinline|noinline|reified|vararg|typealias|where|operator|infix|JvmStatic|Composable|Override)\b/g,
    },
    {
      type: "type",
      re: /\b(?:Int|Long|Float|Double|Boolean|String|Unit|Any|Nothing|Byte|Short|Char|List|Map|Set|Array|Thread|Handler|Looper|MessageQueue|Message|CompletableFuture|Mono|ThreadLocal|Matrix|Bitmap|Canvas|Paint|ValueAnimator|Choreographer|ObjectAnimator|MatrixEvaluator|Modifier|Color|State|MutableState|Random|Particle|Continuation|CoroutineScope|Dispatchers|Job|Deferred|Flow|View|Context|Runnable|Future|Pair|Result|Duration|Exception)\b/g,
    },
    {
      type: "builtin",
      re: /\b(?:println|print|require|check|error|TODO|arrayOf|listOf|setOf|mapOf|mutableListOf|mutableSetOf|mutableMapOf|with|run|apply|also|let|use|delay|launch|async|await|coroutineScope|withContext|withTimeout|remember|mutableStateOf|derivedStateOf|collectAsState|LaunchedEffect|Modifier|Composable)\b/g,
    },
  ],
  c: [
    { type: "comment", re: /\/\/[^\n]*/g },
    { type: "comment", re: /\/\*[\s\S]*?\*\//g },
    { type: "string", re: /"(?:\\.|[^"\\])*"/g },
    { type: "string", re: /'(?:\\.|[^'\\]|\\x[0-9a-fA-F]{2})'/g },
    {
      type: "directive",
      re: /^#\s*(?:include|define|undef|ifdef|ifndef|endif|else|elif|pragma)\b[^\n]*/gm,
    },
    {
      type: "number",
      re: /\b0x[0-9a-fA-F]+|\b\d+(?:\.\d+)?(?:f|F|l|L|u|U)?\b/g,
    },
    {
      type: "keyword",
      re: /\b(?:auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|inline|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while|NULL|true|false|fork|clone|exec|wait|waitpid|pthread_create|printf|fprintf|malloc|free|mmap|munmap|open|close|read|write|pipe|socket|bind|listen|accept|connect|send|recv|main)\b/g,
    },
    {
      type: "type",
      re: /\b(?:size_t|ssize_t|pid_t|uid_t|gid_t|off_t|mode_t|time_t|FILE|DIR|jmp_buf|va_list|socklen_t|in_addr|sockaddr|sockaddr_in|pthread_t|pthread_attr_t)\b/g,
    },
    {
      type: "builtin",
      re: /\b(?:CLONE_VM|CLONE_FS|CLONE_FILES|CLONE_SIGHAND|CLONE_THREAD|CLONE_SYSVSEM|CLONE_SETTLS|CLONE_PARENT_SETTID|CLONE_CHILD_CLEARTID|CLONE_CHILD_SETTID|SIGCHLD|MAP_FAILED|EXIT_SUCCESS|EXIT_FAILURE|EOF|NULL|O_RDONLY|O_WRONLY|O_RDWR|O_CREAT|O_TRUNC|PROT_READ|PROT_WRITE|MAP_PRIVATE|MAP_ANONYMOUS)\b/g,
    },
  ],
  asm: [
    { type: "comment", re: /\/\/[^\n]*/g },
    { type: "comment", re: /\/\*[\s\S]*?\*\//g },
    { type: "comment", re: /#[^\n]*/g },
    {
      type: "directive",
      re: /\.(?:globl|macro|endm|text|data|align|type|size|weak|ascii|asciz|string|byte|word|long|skip|org|set|equ|if|else|endif|ifdef|ifndef|include)\b[^\n]*/g,
    },
    {
      type: "register",
      re: /\b(?:x\d+|w\d+|sp|lr|pc|fp|xzr|wzr|r\d+|rax|rbx|rcx|rdx|rsi|rdi|rbp|rsp|r8|r9|r10|r11|r12|r13|r14|r15|eax|ebx|ecx|edx|esi|edi|ebp|esp|eip|ax|bx|cx|dx|si|di|bp|sp|ip|al|bl|cl|dl|cs|ds|es|fs|gs|ss|rip|xmm\d+|ymm\d+)\b/gi,
    },
    {
      type: "keyword",
      re: /\b(?:add|sub|mul|mov|str|ldr|stp|ldp|stur|ldur|ret|bl|blr|br|cbz|cbnz|b|cmp|tst|and|orr|eor|lsl|lsr|asr|mvn|neg|adc|sbc|push|pop|call|jmp|je|jne|jz|jnz|test|lea|nop|int|syscall|sysenter|sysexit|sysret|cpu_switch_to)\b/gi,
    },
    {
      type: "number",
      re: /\b0x[0-9a-fA-F]+|\B#-?0x[0-9a-fA-F]+|\B#-?\d+\b|\b\d+\b/g,
    },
  ],
  glsl: [
    { type: "comment", re: /\/\/[^\n]*/g },
    { type: "comment", re: /\/\*[\s\S]*?\*\//g },
    { type: "number", re: /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?f?\b/g },
    {
      type: "keyword",
      re: /\b(?:if|else|for|while|do|break|continue|return|discard|switch|case|default|struct|uniform|varying|attribute|in|out|inout|const|precision|layout|flat|smooth|lowp|mediump|highp|true|false)\b/g,
    },
    {
      type: "type",
      re: /\b(?:void|bool|int|uint|float|double|vec2|vec3|vec4|mat2|mat3|mat4|ivec2|ivec3|ivec4|sampler2D|samplerCube)\b/g,
    },
    {
      type: "builtin",
      re: /\b(?:gl_PointCoord|gl_FragColor|gl_FragCoord|gl_Position|gl_PointSize|sin|cos|tan|pow|exp|log|sqrt|abs|min|max|clamp|mix|step|smoothstep|length|distance|dot|cross|normalize|reflect|refract|texture|dFdx|dFdy|fwidth)\b/g,
    },
  ],
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function span(type: string, text: string) {
  return `<span class="syn-${type}">${escapeHtml(text)}</span>`;
}

function collectMatches(source: string, rules: Rule[]) {
  type Match = { start: number; end: number; type: string; text: string };
  const matches: Match[] = [];
  for (const rule of rules) {
    const re = new RegExp(
      rule.re.source,
      rule.re.flags.includes("g") ? rule.re.flags : `${rule.re.flags}g`,
    );
    let m: RegExpExecArray | null;
    while ((m = re.exec(source)) !== null) {
      matches.push({
        start: m.index,
        end: m.index + m[0].length,
        type: rule.type,
        text: m[0],
      });
    }
  }
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const picked: Match[] = [];
  let cursor = 0;
  for (const m of matches) {
    if (m.start < cursor) continue;
    picked.push(m);
    cursor = m.end;
  }
  return picked;
}

export function detectLanguage(code: string, hint?: string): Lang {
  if (hint && hint in RULES) return hint as Lang;
  if (
    /\.globl|cpu_switch_to|^\s+(?:add|mov|str|ldr|stp|ldp|ret)\s+/m.test(code)
  )
    return "asm";
  if (
    /^#include|int\s+main\s*\(|clone\s*\(|CLONE_|pthread_create|glibc/i.test(
      code,
    )
  )
    return "c";
  if (
    /gl_PointCoord|gl_FragColor|uniform\s+\w+|vec[234]\b|discard\b/.test(code)
  )
    return "glsl";
  return "kotlin";
}

export function highlightCode(source: string, lang?: string): string {
  const language = detectLanguage(source, lang);
  const matches = collectMatches(source, RULES[language]);
  let out = "";
  let pos = 0;
  for (const m of matches) {
    if (m.start > pos) out += span("plain", source.slice(pos, m.start));
    out += span(m.type, m.text);
    pos = m.end;
  }
  if (pos < source.length) out += span("plain", source.slice(pos));
  return out;
}

export function highlightPresentationCode(root: ParentNode = document) {
  root
    .querySelectorAll<HTMLElement>(
      "pre.mt-code > code, pre.ca-code > code, pre.pub-code > code",
    )
    .forEach((el) => {
      if (el.dataset.hl === "1") return;
      const raw = el.textContent ?? "";
      const lang = el.dataset.lang || detectLanguage(raw);
      el.innerHTML = highlightCode(raw, lang);
      el.dataset.hl = "1";
    });
}
