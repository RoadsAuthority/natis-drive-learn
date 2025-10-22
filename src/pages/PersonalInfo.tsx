import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ChevronRight, User } from "lucide-react";

const PersonalInfo = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    surname: "",
    firstName: "",
    idNumber: "",
    licenceCode: "B",
    bookingReceipt: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.values(formData).every((val) => val)) {
      localStorage.setItem("personalInfo", JSON.stringify(formData));
      toast.success("Information verified!");
      navigate("/instructions");
    } else {
      toast.error("Please fill in all fields");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-lg bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Personal Information</h1>
              <p className="text-muted-foreground">
                Please verify your information before proceeding
              </p>
            </div>
          </div>

          <div className="bg-accent/30 border border-accent-foreground/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-accent-foreground">
              Your information is required for identification and verification purposes. 
              Please check spelling and ensure all information is correct before proceeding.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="surname">Surname</Label>
                <Input
                  id="surname"
                  value={formData.surname}
                  onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                  placeholder="Enter surname"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                placeholder="Enter ID number"
                className="mt-1"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="licenceCode">Licence Code</Label>
                <Input
                  id="licenceCode"
                  value={formData.licenceCode}
                  onChange={(e) => setFormData({ ...formData, licenceCode: e.target.value })}
                  placeholder="e.g., B"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="bookingReceipt">Booking Receipt Number</Label>
                <Input
                  id="bookingReceipt"
                  value={formData.bookingReceipt}
                  onChange={(e) =>
                    setFormData({ ...formData, bookingReceipt: e.target.value })
                  }
                  placeholder="Enter receipt number"
                  className="mt-1"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg">
              Continue to Test Instructions
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default PersonalInfo;
