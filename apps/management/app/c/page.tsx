import { redirect } from "next/navigation";

const courierAppUrl =
  process.env.NEXT_PUBLIC_COURIER_APP_URL ?? "https://strategic-fleet-courier.vercel.app";

export default function CourierRedirectPage() {
  redirect(courierAppUrl);
}
