const service=require('../inbox.service');const fail=(res,e)=>res.status(e.status||500).json({message:e.status?e.message:'Unable to process inbox request',code:e.code||'INBOX_SERVER_ERROR'});
exports.list=async(req,res)=>{try{res.json(await service.list(req.user.id,req.user.role,req.query));}catch(e){fail(res,e);}};
exports.messages=async(req,res)=>{try{res.json(await service.history(req.user.id,req.params.id,req.query));}catch(e){fail(res,e);}};
exports.send=async(req,res)=>{try{res.status(201).json(await service.send(req.user.id,req.params.id,req.body));}catch(e){fail(res,e);}};
exports.read=async(req,res)=>{try{res.json(await service.markRead(req.user.id,req.params.id,req.body));}catch(e){fail(res,e);}};
exports.openInquiry=async(req,res)=>{try{res.json({conversationId:(await service.openInquiry(req.user.id,req.params.inquiryId)).id});}catch(e){fail(res,e);}};
