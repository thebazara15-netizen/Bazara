"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { decodeToken, getToken } from "../../utils/auth";
import { useWishlist } from "../../components/marketplace/wishlist/WishlistProvider";
import AccountShell from "../../components/marketplace/account/AccountShell";
import AccountOverview from "../../components/marketplace/account/AccountOverview";
import AccountProfile from "../../components/marketplace/account/AccountProfile";
import AccountAddresses from "../../components/marketplace/account/AccountAddresses";
import AccountWishlist from "../../components/marketplace/account/AccountWishlist";
import AccountRfqs from "../../components/marketplace/account/AccountRfqs";
import AccountInquiries from "../../components/marketplace/account/AccountInquiries";
import AccountCart from "../../components/marketplace/account/AccountCart";
import { AccountFeedback, AccountLoading } from "../../components/marketplace/account/AccountState";

export default function AccountPage() {
  const router = useRouter();
  const { items: wishlistItems, error: wishlistError } = useWishlist();
  const [active,setActive]=useState("overview");
  const [token,setToken]=useState(null);
  const [profile,setProfile]=useState(null);
  const [cart,setCart]=useState([]);
  const [addresses,setAddresses]=useState([]);
  const [rfqs,setRfqs]=useState([]);
  const [inquiries,setInquiries]=useState([]);
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [decisionId,setDecisionId]=useState(null);
  const [feedback,setFeedback]=useState(null);

  const request=useCallback(async(path,options={})=>{const response=await fetch(`/api${path}`,{...options,headers:{...(options.headers||{}),Authorization:`Bearer ${token}`}});const data=await response.json();if(!response.ok)throw new Error(data.message||"Unable to load buyer account");return data;},[token]);
  const load=useCallback(async()=>{if(!token)return;try{const [profileData,addressData,cartData,rfqData,inquiryData]=await Promise.all([request("/account/profile"),request("/account/addresses"),request("/cart"),request("/rfqs/my"),request("/inquiries/my")]);setProfile(profileData);setAddresses(Array.isArray(addressData)?addressData:[]);setCart(Array.isArray(cartData)?cartData:Array.isArray(cartData.items)?cartData.items:[]);setRfqs(Array.isArray(rfqData)?rfqData:[]);setInquiries(Array.isArray(inquiryData)?inquiryData:[]);}catch(error){setFeedback({type:"error",message:error.message});}finally{setLoading(false);}},[request,token]);
  useEffect(()=>{const current=getToken();const user=current?decodeToken(current):null;if(!current){localStorage.setItem("redirect","/account");router.push("/login");return;}if(user?.role==="VENDOR"){router.push("/vendor");return;}if(user?.role==="ADMIN"){router.push("/admin");return;}if(user?.role!=="CLIENT"){router.push("/");return;}setToken(current);},[router]);
  useEffect(()=>{if(token)load();},[load,token]);
  useEffect(()=>{if(wishlistError)setFeedback({type:"error",message:wishlistError});},[wishlistError]);

  const saveProfile=async(values)=>{setSaving(true);setFeedback(null);try{const data=await request("/account/profile",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});setProfile(data.profile);setFeedback({type:"success",message:"Profile updated successfully."});}catch(error){setFeedback({type:"error",message:error.message});}finally{setSaving(false);}};
  const createAddress=async(values)=>{setSaving(true);setFeedback(null);try{await request("/account/addresses",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});setAddresses(await request("/account/addresses"));setFeedback({type:"success",message:"Address added."});return true;}catch(error){setFeedback({type:"error",message:error.message});return false;}finally{setSaving(false);}};
  const updateAddress=async(id,values)=>{setSaving(true);setFeedback(null);try{await request(`/account/addresses/${id}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});setAddresses(await request("/account/addresses"));setFeedback({type:"success",message:"Address updated."});return true;}catch(error){setFeedback({type:"error",message:error.message});return false;}finally{setSaving(false);}};
  const deleteAddress=async(id)=>{setSaving(true);setFeedback(null);try{await request(`/account/addresses/${id}`,{method:"DELETE"});setAddresses(await request("/account/addresses"));setFeedback({type:"success",message:"Address removed."});return true;}catch(error){setFeedback({type:"error",message:error.message});return false;}finally{setSaving(false);}};
  const addToCart=async(product)=>{try{const response=await request("/cart",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({productId:product.id,quantity:Math.max(1,Number(product.moq)||1)})});if(response){await load();window.dispatchEvent(new Event("cart:changed"));setFeedback({type:"success",message:"Product added to cart."});}}catch(error){setFeedback({type:"error",message:error.message});}};
  const decideQuote=async(quoteId,status)=>{setDecisionId(quoteId);try{await request(`/rfqs/quotes/${quoteId}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});await load();setFeedback({type:"success",message:status==="ACCEPTED"?"Quotation accepted.":"Quotation rejected."});}catch(error){setFeedback({type:"error",message:error.message});}finally{setDecisionId(null);}};
  const cartProducts=new Set(cart.map((item)=>Number(item.productId)));
  const cartCount=cart.reduce((sum,item)=>sum+Number(item.quantity||0),0);
  const content=active==="overview"?<AccountOverview counts={{wishlist:wishlistItems.length,cart:cartCount,rfqs:rfqs.length,inquiries:inquiries.length}} onNavigate={setActive}/>:active==="profile"?<AccountProfile key={profile?.id} profile={profile} saving={saving} onSave={saveProfile}/>:active==="addresses"?<AccountAddresses addresses={addresses} saving={saving} onCreate={createAddress} onUpdate={updateAddress} onDelete={deleteAddress}/>:active==="wishlist"?<AccountWishlist items={wishlistItems} cartProducts={cartProducts} onAddToCart={addToCart}/>:active==="rfqs"?<AccountRfqs rfqs={rfqs} decisionId={decisionId} onDecision={decideQuote}/>:active==="inquiries"?<AccountInquiries inquiries={inquiries}/>:<AccountCart items={cart}/>;
  return <AccountShell active={active} onNavigate={(section)=>{setActive(section);window.scrollTo({top:0,behavior:"smooth"});}}><AccountFeedback feedback={feedback} onDismiss={()=>setFeedback(null)}/>{loading?<AccountLoading/>:content}</AccountShell>;
}
