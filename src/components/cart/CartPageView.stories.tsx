import type { Meta, StoryContext, StoryObj } from "@storybook/nextjs-vite";
import { type ReactNode, useEffect, useState } from "react";
import { CartPageView } from "@/components/cart/CartPageView";
import { CartProvider } from "@/components/providers/CartProvider";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "macarena:cart:v1";

const oneItem = [
  {
    id: "story-mango",
    flavorId: "flavor-mango",
    flavorName: "Mango Maracuya",
    presentation: "1/2 litro",
    price: 150,
  },
] satisfies CartItem[];

const severalItems = [
  ...oneItem,
  {
    id: "story-pistache",
    flavorId: "flavor-pistache",
    flavorName: "Pistache Siciliano Tostado",
    presentation: "1 litro",
    price: 280,
  },
  {
    id: "story-yogurt",
    flavorId: "flavor-yogurt",
    flavorName: "Yogurt con Frutos Rojos y Compota de Temporada",
    presentation: "1/2 litro",
    price: 150,
  },
] satisfies CartItem[];

type OrderResponse = {
  ok: boolean;
  message?: string;
  totalPrice?: number;
};

const paymentDetails = {
  accountName: "Macarena Gelateria",
  bankClabe: "012180001234567890",
  bankReference: "",
  receiptPhone: "+52 55 1234 5678",
};

type CartStoryParameters = {
  cartItems?: CartItem[];
  orderResponse?: OrderResponse;
};

function CartScenario({
  children,
  context,
}: {
  children: ReactNode;
  context: StoryContext;
}) {
  const parameters = context.parameters as CartStoryParameters;
  const orderResponse = parameters.orderResponse;
  const [storyKey] = useState(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(parameters.cartItems ?? []),
    );
    return context.id;
  });

  useEffect(() => {
    if (!orderResponse) return;

    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.pathname
            : input.url;

      if (!url.endsWith("/api/orders")) {
        return originalFetch(input, init);
      }

      return new Response(
        JSON.stringify(
          orderResponse.ok
            ? {
                _id: "story-order-001",
                status: "pending_confirmation",
                totalPrice: orderResponse.totalPrice ?? 150,
              }
            : {
                message:
                  orderResponse.message ?? "No fue posible crear el pedido.",
              },
        ),
        {
          status: orderResponse.ok ? 201 : 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [orderResponse]);

  return <CartProvider key={storyKey}>{children}</CartProvider>;
}

const meta = {
  title: "Checkout/Cart page",
  component: CartPageView,
  args: {
    paymentDetails,
  },
  decorators: [
    (Story, context) => (
      <CartScenario key={context.id} context={context}>
        <Story />
      </CartScenario>
    ),
  ],
  parameters: {
    cartItems: oneItem,
  },
} satisfies Meta<typeof CartPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyCart: Story = {
  parameters: {
    cartItems: [],
  },
};

export const OneItem: Story = {};

export const SeveralItemsAndLongNames: Story = {
  parameters: {
    cartItems: severalItems,
  },
};

export const SuccessfulOrder: Story = {
  parameters: {
    cartItems: oneItem,
    orderResponse: { ok: true },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByLabelText("Email para confirmar pedido"),
      "cliente@correo.com",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Realizar pedido" }),
    );
    await canvas.findByRole("heading", {
      name: "¡Gracias por tu pedido!",
    });
    await canvas.findByRole("link", {
      name: "Enviar comprobante por WhatsApp",
    });
  },
};

export const SuccessfulOrderWithoutWhatsApp: Story = {
  args: {
    paymentDetails: {
      ...paymentDetails,
      bankReference: "MACARENA-ONLINE",
      receiptPhone: "",
    },
  },
  parameters: {
    cartItems: oneItem,
    orderResponse: { ok: true },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByLabelText("Email para confirmar pedido"),
      "cliente@correo.com",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Realizar pedido" }),
    );
    await canvas.findByRole("heading", {
      name: "¡Gracias por tu pedido!",
    });
    await canvas.findByText("MACARENA-ONLINE");
    await canvas.findByText(/respondiendo al correo de tu pedido/);
  },
};

export const OrderError: Story = {
  parameters: {
    cartItems: oneItem,
    orderResponse: {
      ok: false,
      message: "No pudimos crear tu pedido. Intenta de nuevo.",
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByLabelText("Email para confirmar pedido"),
      "cliente@correo.com",
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Realizar pedido" }),
    );
    await canvas.findByText("No pudimos crear tu pedido. Intenta de nuevo.");
  },
};
