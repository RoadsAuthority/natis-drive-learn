import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBooking } from "@/lib/natisApi";

const slots = ["08:00", "10:00", "12:00", "14:00", "16:00"];

export default function Booking() {
  const navigate = useNavigate();
  const [bookingDate, setBookingDate] = useState("");
  const [slot, setSlot] = useState("");
  const [paid, setPaid] = useState(false);
  const paypalClientId = import.meta.env.VITE_PAYPAL_CLIENT_ID;

  const persistBooking = async () => {
    if (!bookingDate || !slot) {
      toast.error("Choose date and slot.");
      return;
    }
    if (!paid) {
      toast.error("Payment is required before booking confirmation.");
      return;
    }
    await createBooking(bookingDate, slot, paid);
    localStorage.setItem("paymentStatus", "paid");
    toast.success("Booking confirmed.");
    navigate("/instructions");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background p-6">
      <div className="mx-auto max-w-2xl">
        <Card className="p-6 space-y-4">
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5" /> Book Learner Test</h1>
          <div>
            <Label htmlFor="booking-date">Booking date</Label>
            <Input id="booking-date" type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          </div>
          <div>
            <Label>Available slots</Label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {slots.map((value) => (
                <Button key={value} variant={slot === value ? "default" : "outline"} type="button" onClick={() => setSlot(value)}>
                  {value}
                </Button>
              ))}
            </div>
          </div>

          <Card className="p-4">
            <h2 className="font-semibold mb-3">Payment (PayPal)</h2>
            {paypalClientId ? (
              <PayPalScriptProvider options={{ clientId: paypalClientId, currency: "USD" }}>
                <PayPalButtons
                  style={{ layout: "vertical" }}
                  createOrder={(_data, actions) =>
                    actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{ amount: { value: "12.00", currency_code: "USD" } }],
                    })
                  }
                  onApprove={async (_data, actions) => {
                    await actions.order?.capture();
                    setPaid(true);
                    toast.success("Payment captured successfully.");
                  }}
                />
              </PayPalScriptProvider>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  PayPal client id is not configured. Set <code>VITE_PAYPAL_CLIENT_ID</code> to enable live checkout.
                </p>
                <Button type="button" variant="outline" onClick={() => setPaid(true)}>
                  Mark as Paid (Sandbox fallback)
                </Button>
              </div>
            )}
          </Card>

          <Button className="w-full" onClick={persistBooking}>
            Confirm Booking
          </Button>
        </Card>
      </div>
    </div>
  );
}

