import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  caption?: string;
}

export default function LessonImage({ src, alt, caption }: Props) {
  return (
    <figure className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 shadow-sm">
      <div className="relative aspect-[16/10] w-full">
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 640px" className="object-cover" />
      </div>
      {caption && (
        <figcaption className="border-t border-stone-100 bg-white px-4 py-2 text-[12px] font-medium text-stone-500">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
