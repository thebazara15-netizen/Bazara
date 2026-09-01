"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { decodeToken, getToken } from "../../utils/auth";
import AdminShell from "../../components/marketplace/admin/AdminShell";
import AdminOverview from "../../components/marketplace/admin/AdminOverview";
import AdminUsers from "../../components/marketplace/admin/AdminUsers";
import AdminVendorApprovals from "../../components/marketplace/admin/AdminVendorApprovals";
import AdminSuppliers from "../../components/marketplace/admin/AdminSuppliers";
import AdminProducts from "../../components/marketplace/admin/AdminProducts";
import AdminRfqs from "../../components/marketplace/admin/AdminRfqs";
import AdminOrders from "../../components/marketplace/admin/AdminOrders";

const subscribeToAuthCookie = () => () => {};
const getServerToken = () => null;
const emptyData = { users: [], suppliers: [], products: [], rfqs: [], orders: [] };

export default function AdminPage() {
  const router = useRouter();
  const token = useSyncExternalStore(subscribeToAuthCookie, getToken, getServerToken);
  const user = token ? decodeToken(token) : null;
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [active,setActive]=useState("overview");
  const [data,setData]=useState(emptyData);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [savingId,setSavingId]=useState(null);
  const [approvingId,setApprovingId]=useState(null);

  const loadData = useCallback(async () => {
    if (!token || user?.role !== "ADMIN") return;
    setLoading(true); setError("");
    try {
      const names=["users","suppliers","products","rfqs","orders"];
      const responses=await Promise.all(names.map((name)=>fetch(`${API}/api/admin/${name}`,{headers:{Authorization:`Bearer ${token}`}})));
      const bodies=await Promise.all(responses.map((response)=>response.json().catch(()=>({}))));
      const failed=responses.findIndex((response)=>!response.ok);
      if(failed>=0) throw new Error(bodies[failed]?.message||`Unable to load ${names[failed]}`);
      setData(Object.fromEntries(names.map((name,index)=>[name,Array.isArray(bodies[index])?bodies[index]:[]])));
    } catch (requestError) { setError(requestError.message||"Unable to load the administration workspace."); }
    finally { setLoading(false); }
  }, [API, token, user?.role]);

  useEffect(()=>{if(!token){if(typeof window!=="undefined")localStorage.setItem("redirect","/admin");router.replace("/login");return;}if(user?.role!=="ADMIN"){router.replace("/");return;}loadData();},[loadData,router,token,user?.role]);

  const approveVendor=async(vendor)=>{setApprovingId(vendor.id);setError("");try{const response=await fetch(`${API}/api/admin/approve/${vendor.id}`,{method:"PUT",headers:{Authorization:`Bearer ${token}`}});const body=await response.json();if(!response.ok)throw new Error(body.message||"Unable to approve vendor");setData((current)=>({...current,users:current.users.map((item)=>item.id===vendor.id?{...item,isVerified:true}:item),suppliers:current.suppliers.map((item)=>item.id===vendor.id?{...item,isVerified:true}:item)}));setNotice(`${vendor.companyName||vendor.email} was approved.`);return true;}catch(actionError){setError(actionError.message);return false;}finally{setApprovingId(null);}};
  const saveProduct=async(id,form)=>{setSavingId(id);setError("");try{const response=await fetch(`${API}/api/admin/product/${id}/edit`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(form)});const body=await response.json();if(!response.ok)throw new Error(body.message||"Unable to update product");setData((current)=>({...current,products:current.products.map((item)=>item.id===id?{...item,...body.product,vendor:item.vendor}:item)}));setNotice("Product updated successfully.");return true;}catch(actionError){setError(actionError.message);return false;}finally{setSavingId(null);}};
  const deleteProduct=async(id)=>{setSavingId(id);setError("");try{const response=await fetch(`${API}/api/admin/product/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}});const body=await response.json();if(!response.ok)throw new Error(body.message||"Unable to delete product");setData((current)=>({...current,products:current.products.filter((item)=>item.id!==id),suppliers:current.suppliers.map((supplier)=>supplier.id===current.products.find((item)=>item.id===id)?.vendorId?{...supplier,productCount:Math.max(0,supplier.productCount-1)}:supplier)}));setNotice("Product deleted successfully.");return true;}catch(actionError){setError(actionError.message);return false;}finally{setSavingId(null);}};

  if (!token || user?.role!=="ADMIN") return <main className="min-h-screen bg-slate-50"><div className="marketplace-container py-16 text-center text-sm text-slate-600">Redirecting to the appropriate workspace…</div></main>;
  const content={overview:<AdminOverview users={data.users} products={data.products} rfqs={data.rfqs} orders={data.orders}/>,users:<AdminUsers users={data.users}/>,approvals:<AdminVendorApprovals vendors={data.users.filter((item)=>item.role==="VENDOR")} approvingId={approvingId} onApprove={approveVendor}/>,suppliers:<AdminSuppliers suppliers={data.suppliers}/>,products:<AdminProducts products={data.products} apiBase={API} savingId={savingId} onSave={saveProduct} onDelete={deleteProduct}/>,rfqs:<AdminRfqs rfqs={data.rfqs}/>,orders:<AdminOrders orders={data.orders}/>}[active];
  return <AdminShell active={active} onNavigate={setActive}>{notice&&<div role="status" className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><span>{notice}</span><button type="button" onClick={()=>setNotice("")} className="font-bold">Dismiss</button></div>}{error&&<div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}<button type="button" onClick={loadData} className="ml-3 font-bold underline">Retry</button></div>}{loading?<div className="grid gap-4 sm:grid-cols-2"><div className="h-36 animate-pulse rounded-2xl bg-slate-200"/><div className="h-36 animate-pulse rounded-2xl bg-slate-200"/></div>:content}</AdminShell>;
}
