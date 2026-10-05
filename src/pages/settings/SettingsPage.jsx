import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import Spinner from '../../components/Spinner';

export default function SettingsPage() {
  const [settings, setSettings] = useState(null);
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    api.get('/settings').then((res) => setSettings(res.data.data.settings));
  }, []);

  if (!settings) return <Spinner />;

  const save = async (e) => {
    e.preventDefault();
    const fd = new FormData();
    ['storeName', 'phone', 'email', 'address', 'currency'].forEach((k) => fd.append(k, settings[k] || ''));
    if (logo) fd.append('storeLogo', logo);
    const res = await api.put('/settings', fd);
    setSettings(res.data.data.settings);
    toast.success('Settings saved');
  };

  return (
    <div>
      <PageHeader title="Settings" subtitle="Store identity used on receipts" />
      <form onSubmit={save} className="card grid max-w-xl gap-3">
        <div>
          <label className="label">Store name</label>
          <input className="input" value={settings.storeName} onChange={(e) => setSettings({ ...settings, storeName: e.target.value })} />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="input" value={settings.phone} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" value={settings.email} onChange={(e) => setSettings({ ...settings, email: e.target.value })} />
        </div>
        <div>
          <label className="label">Address</label>
          <input className="input" value={settings.address} onChange={(e) => setSettings({ ...settings, address: e.target.value })} />
        </div>
        <div>
          <label className="label">Currency</label>
          <input className="input" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
        </div>
        <div>
          <label className="label">Store logo</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setLogo(e.target.files[0])} />
        </div>
        <Button type="submit">Save settings</Button>
      </form>
    </div>
  );
}
