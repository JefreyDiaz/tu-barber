import { isVideoBackground, videoBackgroundMimeType } from '@/lib/tenant/branding';

interface TenantPublicBackgroundProps {
  readonly url: string;
  readonly overlayClassName?: string;
}

export default function TenantPublicBackground({
  url,
  overlayClassName = 'bg-black/50',
}: TenantPublicBackgroundProps) {
  if (isVideoBackground(url)) {
    return (
      <>
        <video autoPlay loop muted playsInline className="absolute inset-0 h-full w-full object-cover animate-fade-in">
          <source src={url} type={videoBackgroundMimeType(url)} />
        </video>
        <div className={`absolute inset-0 animate-fade-in ${overlayClassName}`} />
      </>
    );
  }

  return (
    <>
      <div
        className="absolute inset-0 animate-fade-in bg-cover bg-center"
        style={{ backgroundImage: `url(${url})` }}
      />
      <div className={`absolute inset-0 animate-fade-in ${overlayClassName}`} />
    </>
  );
}
