import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Card from "./Card";
import Badge from "./Badge";
import type { Course } from "@/data/courses";

export default function CourseCard({ course }: { course: Course }) {
  return (
    <Link href={`/curriculum/${course.slug}`} className="block h-full">
      <Card className="flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-medium text-navy-900">{course.name}</h3>
          <Badge>{course.status}</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-navy-700/80">{course.description}</p>
        <ul className="mt-5 space-y-2">
          {course.includes.map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-navy-800/80">
              <Check size={14} className="text-teal-600" strokeWidth={3} />
              {item}
            </li>
          ))}
        </ul>
        <span className="mt-5 flex items-center gap-1.5 text-sm font-medium text-teal-700">
          View course
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      </Card>
    </Link>
  );
}
