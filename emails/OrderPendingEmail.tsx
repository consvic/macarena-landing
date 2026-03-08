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
  const bankName = process.env.BANK_ACCOUNT_NAME ?? "Macarena Gelateria";
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
              <Text key={`${item.flavorName}-${item.presentation}`}>
                {item.quantity} x {item.flavorName} ({item.presentation}) -{" "}
                {formatMXN(item.subtotal)}
              </Text>
            ))}
          </Section>

          <Hr />

          <Text>
            Total: <strong>{formatMXN(safeOrder.totalPrice)}</strong>
          </Text>
          <Text>
            Para confirmar tu pedido realiza una transferencia bancaria con los
            siguientes datos:
          </Text>
          <Text>Beneficiario: {bankName}</Text>
          <Text>CLABE: {bankClabe}</Text>
          <Text>Referencia: {bankRef}</Text>
          <Text>
            Envia tu comprobante respondiendo este correo y confirmaremos tu
            orden.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const PreviewProps = {
  order: PREVIEW_ORDER,
} satisfies { order: OrderEmailPayload };
