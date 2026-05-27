import { formatDateShort } from "@/lib/formatDate";
import type { CertificateData } from "@/lib/certificateApi";

type Props = {
  data: CertificateData;
  className?: string;
};

export default function LearnerCertificate({ data, className = "" }: Props) {
  const passedLabel = formatDateShort(data.passedAt) ?? new Date(data.passedAt).toLocaleDateString();

  return (
    <div
      id="learner-certificate"
      className={`relative mx-auto aspect-[1123/794] w-full max-w-[800px] overflow-hidden rounded-lg shadow-lg print:shadow-none ${className}`}
    >
      <img
        src="/certificate-bg.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        aria-hidden
      />
      <div className="relative z-10 flex h-full flex-col items-center px-8 pb-12 pt-[18%] text-center text-black sm:px-14">
        <h1 className="font-serif text-3xl font-bold tracking-[0.2em] sm:text-4xl">CERTIFICATE</h1>
        <p className="mt-1 font-serif text-lg tracking-[0.35em] sm:text-xl">OF ACHIEVEMENT</p>

        <p className="mt-8 text-xs font-medium tracking-wide sm:text-sm">THIS CERTIFICATE IS PRESENTED TO :</p>

        <p className="mt-3 min-w-[60%] border-b-2 border-black px-4 pb-1 font-serif text-2xl font-semibold sm:text-3xl">
          {data.fullName}
        </p>

        <p className="mt-6 max-w-lg text-xs leading-relaxed sm:text-sm">
          Congratulations on your remarkable success in the NaTIS online learner theory test. You achieved{" "}
          <strong>{data.percentage.toFixed(1)}%</strong> ({data.score} of {data.total} correct) — licence code{" "}
          <strong>{data.licenceCode}</strong>
          {data.idNumber ? (
            <>
              {" "}
              · ID <strong>{data.idNumber}</strong>
            </>
          ) : null}
          . Your dedication and passion have set a remarkable standard.
        </p>

        <p className="mt-4 text-[10px] text-neutral-700 sm:text-xs">
          Certificate no. {data.certificateId} · Issued {passedLabel}
        </p>

        <div className="mt-auto flex w-full max-w-md justify-between gap-8 pt-8 text-xs">
          <div className="flex-1">
            <div className="border-b border-black" />
            <p className="mt-1 font-medium tracking-wide">MANAGER</p>
          </div>
          <div className="flex-1">
            <div className="border-b border-black" />
            <p className="mt-1 font-medium tracking-wide">CEO</p>
          </div>
        </div>
      </div>
    </div>
  );
}
