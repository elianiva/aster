import { defineComponent, createLibrary } from "@openuidev/react-lang";
import { z } from "zod/v4";
import { TextContent } from "./text-content";
import { Heading } from "./heading";
import { List } from "./list";
import { Quiz } from "./quiz";
import { StatCard } from "./stat-card";
import { Stack, BentoGrid, BentoCard } from "~/components/layout";
import { Chart } from "./charts";
import { Callout } from "./callout";
import { CodeBlock } from "./code-block";
import { Section } from "./section";
import { Steps } from "./steps";
import { AsterTabs } from "./tabs";

export const TextContentComponent = defineComponent({
  name: "TextContent",
  description:
    "Renders markdown text. Use for all prose, explanations, code blocks, math, and diagrams.",
  props: z.object({
    content: z.string().describe("Markdown text content"),
  }),
  component: ({ props }) => <TextContent content={props.content} />,
});

export const HeadingComponent = defineComponent({
  name: "Heading",
  description: "Section heading. Use for titles, subtitles, and section labels — NOT TextContent.",
  props: z.object({
    text: z.string().describe("Heading text"),
    level: z
      .enum(["1", "2", "3", "4", "5", "6"])
      .describe("Heading level: 1 = largest, 6 = smallest"),
  }),
  component: ({ props }) => <Heading text={props.text} level={props.level} />,
});

export const ListComponent = defineComponent({
  name: "List",
  description:
    "Ordered or unordered list. Use for bullet points, steps, features, or any enumerated content.",
  props: z.object({
    items: z.array(z.string()).describe("List items (supports markdown)"),
    ordered: z.boolean().optional().describe("true for numbered list, false or omit for bullets"),
  }),
  component: ({ props }) => <List items={props.items} ordered={props.ordered} />,
});

export const QuizComponent = defineComponent({
  name: "Quiz",
  description: "Interactive quiz with question, options, and optional answer reveal.",
  props: z.object({
    question: z.string().describe("The quiz question"),
    options: z.array(z.string()).describe("Answer options (2-6)"),
    correctIndex: z
      .number()
      .optional()
      .describe("Index of correct answer (0-based). Omit to hide answer."),
    explanation: z.string().optional().describe("Explanation shown after answering"),
  }),
  component: ({ props }) => (
    <Quiz
      question={props.question}
      options={props.options}
      correctIndex={props.correctIndex}
      explanation={props.explanation}
    />
  ),
});

export const CalloutComponent = defineComponent({
  name: "Callout",
  description:
    "Highlighted box for important information. Use for key concepts, warnings, tips, and notes.",
  props: z.object({
    variant: z
      .enum(["info", "warning", "tip", "key"])
      .optional()
      .describe("Visual style: info (blue), warning (amber), tip (green), key (purple)"),
    title: z.string().optional().describe("Custom title. Defaults to variant name."),
    content: z.string().describe("Content (supports markdown)"),
  }),
  component: ({ props }) => (
    <Callout variant={props.variant} title={props.title}>
      {props.content}
    </Callout>
  ),
});

export const CodeBlockComponent = defineComponent({
  name: "CodeBlock",
  description:
    "Code block with language label and copy button. Use for standalone code examples — NOT inline code in TextContent.",
  props: z.object({
    language: z.string().describe("Programming language (e.g. 'javascript', 'python', 'rust')"),
    code: z.string().describe("The code content"),
    filename: z.string().optional().describe("Optional filename to display"),
  }),
  component: ({ props }) => (
    <CodeBlock language={props.language} code={props.code} filename={props.filename} />
  ),
});

export const StepsComponent = defineComponent({
  name: "Steps",
  description:
    "Numbered sequential steps with connecting line. Use for processes, tutorials, and how-to guides.",
  props: z.object({
    items: z.array(z.string()).describe("Step descriptions in order (supports markdown)"),
  }),
  component: ({ props }) => <Steps items={props.items} />,
});

export const TabsComponent = defineComponent({
  name: "Tabs",
  description:
    "Tabbed content sections. Use for organizing alternative views, comparing approaches, or grouping related content.",
  props: z.object({
    items: z
      .array(
        z.object({
          label: z.string().describe("Tab label"),
          children: z.array(z.string()).describe("Component references for this tab"),
        }),
      )
      .describe("Tab items with labels and content"),
  }),
  component: ({ props, renderNode }) => (
    <AsterTabs
      items={props.items.map((item) => ({
        label: item.label,
        content: <>{item.children.map((id) => renderNode(id))}</>,
      }))}
    />
  ),
});

export const StackComponent = defineComponent({
  name: "Stack",
  description: "Vertical flex layout. Use as root container for non-grid responses.",
  props: z.object({
    children: z.array(z.string()).describe("Array of component identifiers to render vertically"),
  }),
  component: ({ props, renderNode }) => <Stack>{props.children.map((id) => renderNode(id))}</Stack>,
});

export const BentoGridComponent = defineComponent({
  name: "BentoGrid",
  description:
    "CSS grid layout for dashboard-style compositions. Use with StatCards, charts, and mixed content.",
  props: z.object({
    children: z.array(z.string()).describe("Array of component identifiers to place in grid cells"),
    columns: z.enum(["2", "3", "4"]).optional(),
  }),
  component: ({ props, renderNode }) => (
    <BentoGrid columns={Number(props.columns ?? 3) as 2 | 3 | 4}>
      {props.children.map((id) => renderNode(id))}
    </BentoGrid>
  ),
});

export const BentoCardComponent = defineComponent({
  name: "BentoCard",
  description: "Card wrapper for grid items. Optional column span.",
  props: z.object({
    children: z
      .array(z.string())
      .describe("Array of component identifiers to render inside the card"),
    span: z.number().optional(),
  }),
  component: ({ props, renderNode }) => (
    <BentoCard span={props.span}>{props.children.map((id) => renderNode(id))}</BentoCard>
  ),
});

export const SectionComponent = defineComponent({
  name: "Section",
  description:
    "Visually groups related content. Use to bundle a unit of related components without grid layout.",
  props: z.object({
    title: z.string().optional().describe("Optional section title"),
    children: z
      .array(z.string())
      .describe("Array of component identifiers to render inside the section"),
  }),
  component: ({ props, renderNode }) => (
    <Section title={props.title}>{props.children.map((id) => renderNode(id))}</Section>
  ),
});

export const StatCardComponent = defineComponent({
  name: "StatCard",
  description: "Displays a metric with label, large value, and optional subtitle.",
  props: z.object({
    label: z.string(),
    value: z.string(),
    subtitle: z.string().optional(),
  }),
  component: ({ props }) => (
    <StatCard label={props.label} value={props.value} subtitle={props.subtitle} />
  ),
});

const ChartComponent = defineComponent({
  name: "Chart",
  description:
    "Unified chart component. Use type to select visualization: bar (comparing quantities), line (trends over time), pie (proportions), area (cumulative trends).",
  props: z.object({
    type: z.enum(["bar", "line", "pie", "area"]).describe("Chart type"),
    title: z.string().optional().describe("Chart title"),
    labels: z
      .array(z.string())
      .optional()
      .describe("X-axis labels (for bar, line, area — ignored for pie)"),
    datasets: z
      .array(
        z.object({
          label: z.string(),
          data: z.array(z.number()),
        }),
      )
      .optional()
      .describe("Data series (for bar, line, area — ignored for pie)"),
    data: z
      .array(
        z.object({
          name: z.string(),
          value: z.number(),
        }),
      )
      .optional()
      .describe("Pie data with name and value (for pie only)"),
  }),
  component: ({ props }) => (
    <Chart
      type={props.type}
      title={props.title}
      labels={props.labels}
      datasets={props.datasets}
      data={props.data}
    />
  ),
});

export const asterLibrary = createLibrary({
  root: "Stack",
  components: [
    TextContentComponent,
    HeadingComponent,
    ListComponent,
    QuizComponent,
    CalloutComponent,
    CodeBlockComponent,
    StepsComponent,
    TabsComponent,
    StackComponent,
    BentoGridComponent,
    BentoCardComponent,
    SectionComponent,
    StatCardComponent,
    ChartComponent,
  ],
});
