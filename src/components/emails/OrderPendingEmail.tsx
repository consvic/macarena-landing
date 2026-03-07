import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { OrderEmailPayload } from "@/lib/email/types";
import { formatMXN } from "@/lib/pricing";

export function OrderPendingEmail({ order }: { order: OrderEmailPayload }) {
  const bankName = process.env.BANK_ACCOUNT_NAME ?? "Macarena Gelateria";
  const bankClabe = process.env.BANK_ACCOUNT_CLABE ?? "000000000000000000";
  const bankRef = process.env.BANK_ACCOUNT_REFERENCE ?? String(order._id);

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
          <Heading style={{ color: "#151f49" }}>Macarena Gelateria</Heading>
          <Text>Hola {order.customerName}, recibimos tu pedido.</Text>
          <Text>
            Estado actual: <strong>Pendiente de confirmacion</strong>
          </Text>

          <Section>
            {order.items.map((item) => (
              <Text key={`${item.flavorName}-${item.presentation}`}>
                {item.quantity} x {item.flavorName} ({item.presentation}) -{" "}
                {formatMXN(item.subtotal)}
              </Text>
            ))}
          </Section>

          <Hr />

          <Text>
            Total: <strong>{formatMXN(order.totalPrice)}</strong>
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
