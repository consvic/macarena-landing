import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { resolveEmailAssetUrl } from "@/lib/email/assets";
import type { OrderEmailPayload } from "@/lib/email/types";
import { formatMXN } from "@/lib/pricing";

const PREVIEW_ORDER: OrderEmailPayload = {
  _id: "preview-order-002",
  customerName: "Cliente Demo",
  customerEmail: "cliente@demo.com",
  status: "confirmed",
  totalPrice: 430,
  currency: "MXN",
  items: [
    {
      flavorName: "Frutos Rojos",
      presentation: "1 litro",
      quantity: 1,
      subtotal: 280,
    },
    {
      flavorName: "Coco",
      presentation: "1/2 litro",
      quantity: 1,
      subtotal: 150,
    },
  ],
};

export default function OrderConfirmedEmail({
  order = PREVIEW_ORDER,
}: {
  order?: OrderEmailPayload;
}) {
  const safeOrder: OrderEmailPayload = {
    ...PREVIEW_ORDER,
    ...order,
    items: order?.items ?? PREVIEW_ORDER.items,
  };
  const logoUrl = resolveEmailAssetUrl("/MacaAzul1.png");

  return (
    <Html>
      <Head />
      <Preview>Tu pedido fue confirmado</Preview>
      <Body
        style={{
          backgroundColor: "#f8f6f3",
          fontFamily: "sans-serif",
          color: "#181819",
        }}
      >
        <Container
          style={{ maxWidth: "600px", margin: "0 auto", padding: "24px" }}
        >
          <Section style={{ marginBottom: "16px", textAlign: "center" }}>
            <Img
              src={logoUrl}
              alt="Macarena Gelateria"
              width={96}
              height={96}
              style={{ margin: "0 auto" }}
            />
          </Section>
          <Heading style={{ color: "#151f49" }}>Macarena Gelateria</Heading>
          <Text>
            Hola {safeOrder.customerName}, tu pedido ha sido confirmado.
          </Text>
          <Text>
            Estado actual: <strong>Confirmado</strong>
          </Text>

          <Section>
            {safeOrder.items.map((item) => (
              <Section
                key={`${item.flavorName}-${item.presentation}`}
                style={{
                  border: "1px solid #e6d8c5",
                  borderRadius: "12px",
                  padding: "10px 12px",
                  marginBottom: "8px",
                  backgroundColor: "#fffdf9",
                }}
              >
                <Text style={{ margin: 0 }}>
                  {item.quantity} x {item.flavorName} ({item.presentation})
                </Text>
                <Text style={{ margin: "4px 0 0", color: "#151f49" }}>
                  {formatMXN(item.subtotal)}
                </Text>
              </Section>
            ))}
          </Section>

          <Text>
            Total: <strong>{formatMXN(safeOrder.totalPrice)}</strong>
          </Text>
          <Text>
            Gracias por tu compra. Te avisaremos por este medio cuando este
            listo para entrega.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const PreviewProps = {
  order: PREVIEW_ORDER,
} satisfies { order: OrderEmailPayload };
