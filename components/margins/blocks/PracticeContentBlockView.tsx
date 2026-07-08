import type { PracticeContentBlock } from "@/lib/marginsPracticeCourses";
import ChatBubble from "./ChatBubble";
import EvidenceExhibitCard from "./EvidenceExhibitCard";
import AnatomyDiagram from "./AnatomyDiagram";
import HistoryTimeline from "./HistoryTimeline";
import SchematicChart from "./SchematicChart";
import ComparisonChart from "./ComparisonChart";
import ContrastCard from "./ContrastCard";
import CalloutCard from "./CalloutCard";
import LessonImage from "./LessonImage";

interface Props {
  block: PracticeContentBlock;
}

export default function PracticeContentBlockView({ block }: Props) {
  switch (block.type) {
    case "paragraph":
      return <p className="text-[15px] text-stone-700 leading-relaxed">{block.text}</p>;
    case "callout":
      return <CalloutCard text={block.text} label={block.label} />;
    case "image":
      return <LessonImage src={block.src} alt={block.alt} caption={block.caption} />;
    case "chatMessage":
      return <ChatBubble characterId={block.sender} text={block.text} timestamp={block.timestamp} />;
    case "chatExchange":
      return (
        <div className="flex flex-col gap-2.5 rounded-2xl border border-stone-100 bg-stone-50/60 p-4">
          {block.messages.map((m, i) => (
            <ChatBubble
              key={i}
              characterId={m.sender}
              text={m.text}
              timestamp={m.timestamp}
              align={i % 2 === 0 ? "left" : "right"}
            />
          ))}
        </div>
      );
    case "evidenceExhibit":
      return <EvidenceExhibitCard label={block.label} content={block.content} annotation={block.annotation} />;
    case "anatomyDiagram":
      return (
        <AnatomyDiagram
          claim={block.claim}
          evidence={block.evidence}
          reasoning={block.reasoning}
          highlight={block.highlight}
        />
      );
    case "timeline":
      return <HistoryTimeline events={block.events} />;
    case "schematicChart":
      return (
        <SchematicChart
          chartKind={block.chartKind}
          caption={block.caption}
          points={block.points}
          illustrative={block.illustrative}
        />
      );
    case "comparisonChart":
      return <ComparisonChart leftLabel={block.leftLabel} rightLabel={block.rightLabel} rows={block.rows} />;
    case "contrastCard":
      return (
        <ContrastCard weak={block.weak} strong={block.strong} weakNote={block.weakNote} strongNote={block.strongNote} />
      );
  }
}
