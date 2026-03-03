import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "@/App";
import axios from "axios";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Pencil, Upload, FileText, Trash2, Download, Eye } from "lucide-react";
import { toast } from "sonner";

// Helper to display value or dash
const DisplayValue = ({ value }) => (
  <span className="text-sm">{value || "—"}</span>
);

// Field row component
const FieldRow = ({ label, value }) => (
  <div className="py-2 border-b border-gray-100 last:border-0">
    <Label className="text-xs text-gray-500 uppercase tracking-wider">{label}</Label>
    <p className="mt-1"><DisplayValue value={value} /></p>
  </div>
);

// Section component for grouping fields
const Section = ({ title, children }) => (
  <div className="mb-6">
    {title && <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</h3>}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
      {children}
    </div>
  </div>
);

const VehicleProfile = ({ brand = "renault" }) => {
  const { vehicleId } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("vehicle");

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isRenault = brand === "renault";

  useEffect(() => {
    const fetchVehicle = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/vehicles/${vehicleId}`, { withCredentials: true });
        setVehicle(res.data);
      } catch (e) {
        console.error("Failed to fetch vehicle", e);
      } finally {
        setLoading(false);
      }
    };
    if (vehicleId) fetchVehicle();
  }, [vehicleId]);

  // Fetch documents for this vehicle
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const res = await axios.get(`${API}/vehicles/${vehicleId}/documents`, { withCredentials: true });
        setDocuments(res.data);
      } catch (e) {
        console.error("Failed to fetch documents", e);
      }
    };
    if (vehicleId) fetchDocuments();
  }, [vehicleId]);

  const handleBack = () => {
    navigate(isRenault ? "/vehicles/renault" : "/vehicles/other-brands");
  };

  // Document handlers
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", "general");

      const res = await axios.post(
        `${API}/vehicles/${vehicleId}/documents`,
        formData,
        { 
          withCredentials: true,
          headers: { "Content-Type": "multipart/form-data" }
        }
      );
      setDocuments([...documents, res.data]);
      toast.success("Document uploaded successfully");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to upload document");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await axios.delete(`${API}/vehicles/${vehicleId}/documents/${docId}`, { withCredentials: true });
      setDocuments(documents.filter(d => d.document_id !== docId));
      toast.success("Document deleted");
    } catch (err) {
      toast.error("Failed to delete document");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Vehicle not found</p>
        <Button variant="outline" className="mt-4 rounded-sm" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Vehicles
        </Button>
      </div>
    );
  }

  // Determine which tabs to show
  const tabs = isRenault
    ? ["vehicle", "customer", "insurance", "dates", "documents", "dealer"]
    : ["vehicle", "customer", "insurance", "dates", "documents"];

  return (
    <div className="space-y-6" data-testid="vehicle-profile">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} data-testid="back-btn">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Button>
          <div>
            <h1 className="font-heading font-black text-2xl md:text-3xl tracking-tighter uppercase">
              Vehicle Profile
            </h1>
            <p className="text-sm text-gray-500 font-mono mt-1">
              {vehicle.vehicle_reg_no || "—"} • {vehicle.vin || "—"}
            </p>
          </div>
        </div>
        <Button variant="outline" className="rounded-sm" onClick={() => navigate(`/vehicles/${isRenault ? 'renault' : 'other-brands'}/${vehicleId}/edit`)} data-testid="edit-btn">
          <Pencil className="w-4 h-4 mr-2" strokeWidth={1.5} /> Edit
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-1 overflow-x-auto pb-px">
          {tabs.map((tab) => {
            const tabLabels = {
              vehicle: "Vehicle",
              customer: "Customer",
              insurance: "Insurance",
              dates: "Dates & Programs",
              documents: "Documents",
              dealer: "Dealer"
            };
            return (
              <Button
                key={tab}
                variant="ghost"
                className={`px-4 py-2 rounded-none border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-black hover:border-gray-300"
                }`}
                onClick={() => setActiveTab(tab)}
                data-testid={`tab-${tab}`}
              >
                {tabLabels[tab]}
              </Button>
            );
          })}
        </div>
      </div>

        {/* TAB 1 — Vehicle (combined with Service) */}
        {activeTab === "vehicle" && (
          <div className="mt-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                <Section title="Vehicle Details">
                  <FieldRow label="Brand" value={isRenault ? "Renault" : vehicle.make} />
                  <FieldRow label="VIN #" value={vehicle.vin} />
                  <FieldRow label="Engine #" value={vehicle.engine_no} />
                  <FieldRow label="Temporary/Registration No" value={vehicle.vehicle_reg_no} />
                  <FieldRow label="Model Description" value={vehicle.model} />
                  {isRenault && (
                    <>
                      <FieldRow label="Variant Description" value={vehicle.variant_description} />
                      <FieldRow label="Model Code" value={vehicle.model_code} />
                      <FieldRow label="Color Type" value={vehicle.color_type} />
                      <FieldRow label="Exterior Colour" value={vehicle.exterior_colour} />
                      <FieldRow label="Exterior Colour Code" value={vehicle.exterior_colour_code} />
                    </>
                  )}
                </Section>
                <Section title="Service">
                  <FieldRow label="Last Service Date" value={vehicle.last_service_date} />
                  <FieldRow label="Next Service Due" value={vehicle.next_service_due} />
                  <FieldRow label="Last Odometer Reading" value={vehicle.last_odometer_reading} />
                </Section>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2 — Customer */}
        {activeTab === "customer" && (
          <div className="mt-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                <Section>
                  <FieldRow label="Contact Name" value={vehicle.customer_name} />
                  <FieldRow label="Phone" value={vehicle.customer_phone} />
                  <FieldRow label="Email" value={vehicle.customer_email} />
                  <FieldRow label="Contact Address" value={vehicle.contact_address} />
                  <FieldRow label="Contact Address2" value={vehicle.contact_address2} />
                  <FieldRow label="Contact City" value={vehicle.contact_city} />
                  <FieldRow label="Contact District" value={vehicle.contact_district} />
                  <FieldRow label="Contact State" value={vehicle.contact_state} />
                  <FieldRow label="Contact Country" value={vehicle.contact_country} />
                  <FieldRow label="Contact Zipcode" value={vehicle.contact_zipcode} />
                </Section>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3 — Insurance */}
        {activeTab === "insurance" && (
          <div className="mt-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                <Section title="Own Damage (OD)">
                  <FieldRow label="OD Policy Start Date" value={vehicle.od_policy_start_date} />
                  <FieldRow label="OD Policy End Date" value={vehicle.od_policy_end_date} />
                  <FieldRow label="Own Damage Insurer" value={vehicle.od_insurer} />
                  <FieldRow label="OD Policy Number" value={vehicle.od_policy_number} />
                </Section>
                <Section title="Third Party (TP)">
                  <FieldRow label="TP Policy Start Date" value={vehicle.tp_policy_start_date} />
                  <FieldRow label="TP Policy End Date" value={vehicle.tp_policy_end_date} />
                  <FieldRow label="Third Party Insurer" value={vehicle.tp_insurer} />
                  <FieldRow label="TP Policy Number" value={vehicle.tp_policy_number} />
                </Section>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4 — Dates & Programs */}
        {activeTab === "dates" && (
          <div className="mt-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                <Section title="Common Dates">
                  <FieldRow label="Invoiced Date" value={vehicle.invoiced_date} />
                  <FieldRow label="Vehicle Delivery Date" value={vehicle.delivery_date} />
                  <FieldRow label="VIN Mfg Year" value={vehicle.vin_mfg_year} />
                  <FieldRow label="Warranty Start Date" value={vehicle.warranty_start_date} />
                  <FieldRow label="Warranty End Date" value={vehicle.warranty_end_date} />
                  <FieldRow label="Warranty End Km" value={vehicle.warranty_end_km} />
                </Section>

                {/* Renault-only fields */}
                {isRenault && (
                  <>
                    <Section title="Extended Warranty">
                      <FieldRow label="Extended Warranty Start Date" value={vehicle.ext_warranty_start_date} />
                      <FieldRow label="Extended Warranty End Date" value={vehicle.ext_warranty_end_date} />
                      <FieldRow label="Extended Warranty End Km" value={vehicle.ext_warranty_end_km} />
                    </Section>
                    <Section title="Easy Care">
                      <FieldRow label="Easy Care Name" value={vehicle.easy_care_name} />
                      <FieldRow label="Easy Care Start Date" value={vehicle.easy_care_start_date} />
                      <FieldRow label="Easy Care End Date" value={vehicle.easy_care_end_date} />
                      <FieldRow label="Easy Care End KM" value={vehicle.easy_care_end_km} />
                    </Section>
                    <Section title="RSA (Roadside Assistance)">
                      <FieldRow label="RSA Product Name" value={vehicle.rsa_product_name} />
                      <FieldRow label="RSA Certification Number" value={vehicle.rsa_certification_number} />
                      <FieldRow label="RSA Start Date" value={vehicle.rsa_start_date} />
                      <FieldRow label="RSA End Date" value={vehicle.rsa_end_date} />
                    </Section>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 5 — Documents */}
        {activeTab === "documents" && (
          <div className="mt-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                {/* Upload Section */}
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Vehicle Documents</h3>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <Button
                      variant="outline"
                      className="rounded-sm"
                      onClick={handleFileSelect}
                      disabled={uploading}
                      data-testid="upload-document-btn"
                    >
                      <Upload className="w-4 h-4 mr-2" strokeWidth={1.5} />
                      {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                  </div>
                </div>

                {/* Documents List */}
                {documents.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" strokeWidth={1} />
                    <p className="text-sm">No documents uploaded yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload RC, Insurance, or other vehicle documents</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {documents.map((doc) => (
                      <div
                        key={doc.document_id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-sm hover:bg-gray-50"
                        data-testid={`document-${doc.document_id}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-sm flex items-center justify-center">
                            <FileText className="w-5 h-5 text-gray-500" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{doc.file_name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.document_type} • {(doc.file_size / 1024).toFixed(1)} KB • {new Date(doc.uploaded_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {doc.file_url && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-sm"
                                onClick={() => window.open(doc.file_url, "_blank")}
                                data-testid={`view-doc-${doc.document_id}`}
                              >
                                <Eye className="w-4 h-4" strokeWidth={1.5} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-sm"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = doc.file_url;
                                  link.download = doc.file_name;
                                  link.click();
                                }}
                                data-testid={`download-doc-${doc.document_id}`}
                              >
                                <Download className="w-4 h-4" strokeWidth={1.5} />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-sm text-red-500 hover:text-red-600"
                            onClick={() => handleDeleteDocument(doc.document_id)}
                            data-testid={`delete-doc-${doc.document_id}`}
                          >
                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 6 — Dealer (Renault only) */}
        {isRenault && activeTab === "dealer" && (
          <div className="mt-6">
            <Card className="border border-gray-200 rounded-sm shadow-none">
              <CardContent className="p-6">
                <Section>
                  <FieldRow label="Dealer Code" value={vehicle.dealer_code} />
                  <FieldRow label="Dealer Name" value={vehicle.dealer_name} />
                  <FieldRow label="Dealer Group" value={vehicle.dealer_group} />
                  <FieldRow label="Last Servicing Dealer" value={vehicle.last_servicing_dealer} />
                  <FieldRow label="Penultimate Servicing Dealer" value={vehicle.penultimate_servicing_dealer} />
                </Section>
              </CardContent>
            </Card>
          </div>
        )}
    </div>
  );
};

export default VehicleProfile;
