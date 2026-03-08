import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
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
  _id: "preview-order-001",
  customerName: "Cliente Demo",
  customerEmail: "cliente@demo.com",
  status: "pending_confirmation",
  totalPrice: 580,
  currency: "MXN",
  items: [
    {
      flavorName: "Mango Maracuya",
      presentation: "1 litro",
      quantity: 1,
      subtotal: 280,
    },
    {
      flavorName: "Nutella",
      presentation: "1 litro",
      quantity: 1,
      subtotal: 280,
    },
    {
      flavorName: "Vainilla",
      presentation: "1/2 litro",
      quantity: 1,
      subtotal: 150,
    },
  ],
};

export default function OrderPendingEmail({
  order = PREVIEW_ORDER,
}: {
  order?: OrderEmailPayload;
}) {
  const safeOrder: OrderEmailPayload = {
    ...PREVIEW_ORDER,
    ...order,
    items: order?.items ?? PREVIEW_ORDER.items,
  };
  const accountName = process.env.BANK_ACCOUNT_NAME ?? "Macarena Gelateria";
  const bankClabe = process.env.BANK_ACCOUNT_CLABE ?? "000000000000000000";
  const bankRef = process.env.BANK_ACCOUNT_REFERENCE ?? String(safeOrder._id);
  const logoUrl = resolveEmailAssetUrl("/MacaAzul1.png");

  return (
    <Html>
      <Head />
      <Preview>Tu pedido esta pendiente de confirmacion</Preview>
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
          <Text>Hola {safeOrder.customerName}, recibimos tu pedido.</Text>
          <Text>
            Estado actual: <strong>Pendiente de confirmacion</strong>
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

          <Hr />

          <Text>
            Total: <strong>{formatMXN(safeOrder.totalPrice)}</strong>
          </Text>
          <Section
            style={{
              border: "1px solid #c98d50",
              borderRadius: "12px",
              backgroundColor: "#eddbc3",
              padding: "12px",
              marginTop: "12px",
            }}
          >
            <Text style={{ margin: 0, color: "#640a1a", fontWeight: "700" }}>
              Pago pendiente: realiza la transferencia con estos datos
            </Text>
            <Text style={{ margin: "8px 0 0" }}>
              <strong>Beneficiario:</strong> {accountName}
            </Text>
            <Text style={{ margin: "4px 0 0" }}>
              <strong>CLABE:</strong> {bankClabe}
            </Text>
            <Text style={{ margin: "4px 0 0" }}>
              <strong>Referencia:</strong> {bankRef}
            </Text>
          </Section>
          <Section
            style={{
              borderLeft: "4px solid #151f49",
              backgroundColor: "#fffdf9",
              padding: "10px 12px",
              marginTop: "10px",
            }}
          >
            <Text style={{ margin: 0, color: "#151f49", fontWeight: "700" }}>
              Importante: envia tu comprobante de pago respondiendo este correo.
            </Text>
            <Text style={{ margin: "6px 0 0" }}>
              Confirmaremos tu orden en cuanto validemos la transferencia.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export const PreviewProps = {
  order: PREVIEW_ORDER,
} satisfies { order: OrderEmailPayload };
