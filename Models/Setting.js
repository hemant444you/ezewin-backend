const { Schema, model } = require('mongoose')

const SettingSchema = new Schema({
    bussiness_name: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        required: true
    },
    favicon: {
        type: String,
        required: true
    },
    cgst: {
        type: String,
        required: true
    },
    sgst: {
        type: String,
        required: true
    },
    admin_charge: {
        type: String,
        required: true
    },
    razorpay_key: {
        type: String,
        required: true
    },
    razorpay_secret: {
        type: String,
        required: true
    },
    fcm_key: {
        type: String,
        required: true
    },
    msg91_key: {
        type: String,
        required: true
    },
    msg91_flow_id: {
        type: String,
        required: true
    },
    msg91_sender: {
        type: String,
        required: true
    },
    privacy_policy: {
        type: String,
        required: true
    },
    terms_conditions: {
        type: String,
        required: true
    },
    about_us: {
        type: String,
        required: true
    },
    faqs: {
        type: String,
        required: true
    },
    call_support_number: {
        type: String,
        required: true
    },
    whatsapp_support_number: {
        type: String,
        required: true
    },
    pagination: {
        type: String,
        required: true
    },
    
}, {
    timestamps: true
});

SettingSchema.virtual("logo_path").get(function () {
  return `https://ezewin.s3.ap-south-1.amazonaws.com/${this.logo} `;
});

SettingSchema.virtual("favicon_path").get(function () {
  return `https://ezewin.s3.ap-south-1.amazonaws.com/${this.favicon} `;
});


const Setting = model('Setting', SettingSchema)
module.exports = Setting