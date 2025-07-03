import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  Building, 
  IndianRupee, 
  FileText, 
  Bell, 
  Palette,
  Upload,
  Save
} from 'lucide-react';

const Settings = () => {
  const [businessInfo, setBusinessInfo] = useState({
    companyName: 'Your Business Name',
    email: 'your@email.com',
    phone: '+91 98765 43210',
    address: '123 Business Street, Mumbai, Maharashtra 400001',
    website: 'www.yourbusiness.com',
    gstin: '27AABCU9603R1ZM', // GST Identification Number
    pan: 'AABCU9603R',
    bankDetails: 'Account: 1234567890, IFSC: HDFC0000123, Bank: HDFC Bank'
  });

  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: 'INV',
    invoiceNumber: 1,
    defaultCGST: 9,
    defaultSGST: 9,
    defaultIGST: 18,
    defaultCurrency: 'INR',
    paymentTerms: 'Net 30',
    footerText: 'Thank you for your business! Please pay within the due date.'
  });

  const [notifications, setNotifications] = useState({
    emailReminders: true,
    smsReminders: false,
    overdueAlerts: true,
    paymentReceived: true,
    weeklyReports: true
  });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        {/* Business Information */}
        <TabsContent value="business">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={businessInfo.companyName}
                    onChange={(e) => setBusinessInfo({...businessInfo, companyName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={businessInfo.email}
                    onChange={(e) => setBusinessInfo({...businessInfo, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={businessInfo.phone}
                    onChange={(e) => setBusinessInfo({...businessInfo, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={businessInfo.website}
                    onChange={(e) => setBusinessInfo({...businessInfo, website: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gstin">GSTIN</Label>
                  <Input
                    id="gstin"
                    value={businessInfo.gstin}
                    onChange={(e) => setBusinessInfo({...businessInfo, gstin: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    value={businessInfo.pan}
                    onChange={(e) => setBusinessInfo({...businessInfo, pan: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={businessInfo.address}
                  onChange={(e) => setBusinessInfo({...businessInfo, address: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankDetails">Bank Details</Label>
                <Textarea
                  id="bankDetails"
                  value={businessInfo.bankDetails}
                  onChange={(e) => setBusinessInfo({...businessInfo, bankDetails: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Building className="w-8 h-8 text-gray-400" />
                  </div>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Logo
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoice Settings */}
        <TabsContent value="invoice">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Invoice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
                  <Input
                    id="invoicePrefix"
                    value={invoiceSettings.invoicePrefix}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, invoicePrefix: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber">Next Invoice Number</Label>
                  <Input
                    id="invoiceNumber"
                    type="number"
                    value={invoiceSettings.invoiceNumber}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, invoiceNumber: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultCGST">Default CGST Rate (%)</Label>
                  <Input
                    id="defaultCGST"
                    type="number"
                    value={invoiceSettings.defaultCGST}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, defaultCGST: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultSGST">Default SGST Rate (%)</Label>
                  <Input
                    id="defaultSGST"
                    type="number"
                    value={invoiceSettings.defaultSGST}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, defaultSGST: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultIGST">Default IGST Rate (%)</Label>
                  <Input
                    id="defaultIGST"
                    type="number"
                    value={invoiceSettings.defaultIGST}
                    onChange={(e) => setInvoiceSettings({...invoiceSettings, defaultIGST: Number(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Default Payment Terms</Label>
                  <Select value={invoiceSettings.paymentTerms} onValueChange={(value) => setInvoiceSettings({...invoiceSettings, paymentTerms: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Net 15">Net 15</SelectItem>
                      <SelectItem value="Net 30">Net 30</SelectItem>
                      <SelectItem value="Net 45">Net 45</SelectItem>
                      <SelectItem value="Net 60">Net 60</SelectItem>
                      <SelectItem value="Due on Receipt">Due on Receipt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerText">Invoice Footer Text</Label>
                <Textarea
                  id="footerText"
                  value={invoiceSettings.footerText}
                  onChange={(e) => setInvoiceSettings({...invoiceSettings, footerText: e.target.value})}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailReminders">Email Reminders</Label>
                    <p className="text-sm text-gray-500">Send email reminders for due invoices</p>
                  </div>
                  <Switch
                    id="emailReminders"
                    checked={notifications.emailReminders}
                    onCheckedChange={(checked) => setNotifications({...notifications, emailReminders: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="smsReminders">SMS Reminders</Label>
                    <p className="text-sm text-gray-500">Send SMS reminders for due invoices</p>
                  </div>
                  <Switch
                    id="smsReminders"
                    checked={notifications.smsReminders}
                    onCheckedChange={(checked) => setNotifications({...notifications, smsReminders: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="overdueAlerts">Overdue Alerts</Label>
                    <p className="text-sm text-gray-500">Get notified when invoices become overdue</p>
                  </div>
                  <Switch
                    id="overdueAlerts"
                    checked={notifications.overdueAlerts}
                    onCheckedChange={(checked) => setNotifications({...notifications, overdueAlerts: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="paymentReceived">Payment Received</Label>
                    <p className="text-sm text-gray-500">Get notified when payments are received</p>
                  </div>
                  <Switch
                    id="paymentReceived"
                    checked={notifications.paymentReceived}
                    onCheckedChange={(checked) => setNotifications({...notifications, paymentReceived: checked})}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-gray-500">Receive weekly summary reports</p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) => setNotifications({...notifications, weeklyReports: checked})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Appearance & Branding
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Invoice Template</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                      <div className="text-sm font-medium">Modern</div>
                      <div className="text-xs text-gray-500">Clean and professional</div>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300">
                      <div className="text-sm font-medium">Classic</div>
                      <div className="text-xs text-gray-500">Traditional layout</div>
                    </div>
                    <div className="border-2 border-gray-200 rounded-lg p-4 cursor-pointer hover:border-gray-300">
                      <div className="text-sm font-medium">Minimal</div>
                      <div className="text-xs text-gray-500">Simple and clean</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <div className="w-8 h-8 rounded bg-blue-500 border-2 border-blue-600 cursor-pointer"></div>
                    <div className="w-8 h-8 rounded bg-green-500 border-2 border-transparent cursor-pointer"></div>
                    <div className="w-8 h-8 rounded bg-purple-500 border-2 border-transparent cursor-pointer"></div>
                    <div className="w-8 h-8 rounded bg-red-500 border-2 border-transparent cursor-pointer"></div>
                    <div className="w-8 h-8 rounded bg-orange-500 border-2 border-transparent cursor-pointer"></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="w-5 h-5" />
                Payment Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Razorpay</div>
                      <div className="text-sm text-gray-500">Accept online payments in India</div>
                    </div>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">PayU</div>
                      <div className="text-sm text-gray-500">Indian payment gateway</div>
                    </div>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <IndianRupee className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">Paytm</div>
                      <div className="text-sm text-gray-500">Paytm payment gateway</div>
                    </div>
                  </div>
                  <Button variant="outline">Connect</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
