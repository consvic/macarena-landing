import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { OrderEmailPayload } from "@/lib/email/types";
import { formatMXN } from "@/lib/pricing";

export function OrderConfirmedEmail({ order }: { order: OrderEmailPayload }) {
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
          <Heading style={{ color: "#151f49" }}>Macarena Gelateria</Heading>
          <Text>Hola {order.customerName}, tu pedido ha sido confirmado.</Text>
          <Text>
            Estado actual: <strong>Confirmado</strong>
          </Text>

          <Section>
            {order.items.map((item) => (
              <Text key={`${item.flavorName}-${item.presentation}`}>
                {item.quantity} x {item.flavorName} ({item.presentation}) -{" "}
                {formatMXN(item.subtotal)}
              </Text>
            ))}
          </Section>

          <Text>
            Total: <strong>{formatMXN(order.totalPrice)}</strong>
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
