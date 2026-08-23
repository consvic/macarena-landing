import { CartPageView } from "@/components/cart/CartPageView";

export default function MenuCartPage() {
  return (
    <CartPageView
      paymentDetails={{
        accountName: process.env.BANK_ACCOUNT_NAME ?? "Macarena Gelateria",
        bankClabe: process.env.BANK_ACCOUNT_CLABE ?? "000000000000000000",
        bankReference: process.env.BANK_ACCOUNT_REFERENCE ?? "",
        receiptPhone: process.env.PAYMENT_RECEIPT_PHONE ?? "",
      }}
    />
  );
}
