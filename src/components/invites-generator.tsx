import { INVITES } from "@/lib/constants";

function InviteCard({ name }: { name: string }) {
  return (
    <p className="font-serif text-4xl px-6 py-[58px] border text-center font-bold text-royal-blue">
      {name}
    </p>
  );
}

// tamaño carta: 612px x 792px
export function InvitesGenerator() {
  const invites = INVITES.slice(40, 50);
  return (
    <section
      id="philosophy"
      className="relative overflow-hidden bg-cream-white h-screen"
      data-section="philosophy"
      style={{
        backgroundImage: `url('/MacaOcre3.png')`,
        backgroundSize: "40px 40px",
        backgroundRepeat: "repeat",
        backgroundPosition: "0 0",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Overlay to soften the pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.55)",
          backgroundImage: `
              linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%),
              linear-gradient(-45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%)
            `,
          backgroundSize: "40px 40px",
        }}
      ></div>
      <div className="container mx-auto relative z-10">
        <div className="grid grid-cols-2">
          {invites.map((invite) => (
            <InviteCard name={invite} key={invite} />
          ))}
        </div>
      </div>
    </section>
  );
}
