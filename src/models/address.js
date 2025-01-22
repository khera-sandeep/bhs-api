const mongoose = require('mongoose');
const additionalLocationMappingData = [{
    state: "Punjab",
    districts: ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Malerkotla", "Mansa", "Moga", "Mohali", "Muktsar", "Pathankot", "Patiala", "Rupnagar", "Sangrur", "Shahid Bhagat Singh Nagar", "Tarn Taran"],
    cities: ["Amritsar", "Jandiala", "Ajnala", "Rayya", "Majitha", "Raja", "Ramdas", "Barnala", "Tapa", "Dhanaula", "Bhadaur", "Handiaya", "Bathinda", "Rampura", "Maur", "Raman", "Talwandi", "Mehraj", "Goniana", "Bhucho", "Bhai", "Bhagta", "Kot", "Lehra", "Kotha", "Chaoke", "Mandi", "Rampura", "Balian", "Nathana", "Kot", "Maluka", "Sangat", "Kot", "Faridkot", "Jaitu", "Gobindgarh", "Sirhind", "Bassi", "Amloh", "Khamanon", "Abohar", "Fazilka", "Jalalabad", "Arniwala", "Firozpur", "Zira", "Talwandi", "Guru", "Mallanwala", "Makhu", "Mudki", "Mamdot", "Batala", "Gurdaspur", "Dina", "Qadian", "Dhariwal", "Fatehgarh", "Sri", "Dera", "Hoshiarpur", "Mukerian", "Dasua", "Urmar", "Talwara", "Garhshankar", "Mahilpur", "Hariana", "Gardhiwala", "Sham", "Jalandhar", "Nakodar", "Kartarpur", "Phillaur", "Adampur", "Bhogpur", "Goraya", "Nurmahal", "Shahkot", "Lohian", "Alawalpur", "Mehatpur", "Kapurthala", "Phagwara", "Sultanpur", "Bhulath", "Begowal", "Dhilwan", "Nadala", "Ludhiana", "Khanna", "Jagraon", "Raikot", "Doraha", "Machhiwara", "Sahnewal", "Samrala", "Mullanpur", "Payal", "Malaud", "Mansa", "Budhlada", "Sardulgarh", "Bhikhi", "Bareta", "Boha", "Joga", "Moga", "Bagha", "Dharamkot", "Kot", "Nihal", "Badhni", "Muktsar", "Malout", "Gidderbaha", "Bariwala", "Nawanshahr", "Balachaur", "Banga", "Rahon", "Pathankot", "Sujanpur", "Patiala", "Rajpura", "Nabha", "Samana", "Patran", "Sanaur", "Ghagga", "Bhadson", "Ghanaur", "Rupnagar", "Nangal", "Morinda", "Anandpur", "Chamkaur", "Nurpur", "Kiratpur", "S.A.S Nagar", "Zirakpur", "Kharar", "Naya", "Kurali", "Dera", "Lalru", "Banur", "Malerkotla", "Sangrur", "Sunam", "Dhuri", "Ahmedgarh", "Longowal", "Lehragaga", "Bhawanigarh", "Moonak", "Dirba", "Khanauri", "Cheema", "Amargarh", "Tarn", "Patti", "Bhikhiwind", "Khem", "Amritsar", "Firozpur", "Jalandhar"]
}, {
    state: "Himachal Pradesh",
    districts: ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
    cities: ["Dharamsala", "Solan", "Mandi", "Palampur", "Baddi", "Nahan", "Paonta", "Sundarnagar", "Chamba", "Una", "Kullu", "Hamirpur", "Bilaspur", "Yol", "Nalagarh", "Nurpur", "Kangra", "Baijnath", "Santokhgarh", "Mehatpur", "Shamshi", "Parwanoo", "Manali", "Tira", "Ghumarwin", "Dalhousie", "Rohru", "Nagrota", "Rampur", "Jawalamukhi", "Jogindernagar", "Dera", "Sarkaghat", "Jhakhri", "Indora", "Bhuntar", "Nadaun", "Theog", "Kasauli", "Gagret", "Chuari", "Daulatpur", "Sabathu", "Dalhousie", "Rajgarh", "Arki", "Dagshai", "Seoni", "Talai", "Jutogh", "Chaupal", "Rewalsar", "Bakloh", "Jubbal", "Bhota", "Banjar", "Naina", "Kotkhai", "Narkanda"]
}, {
    state: "Maharashtra",
    districts: ["Mumbai City", "Mumbai Suburban", "Thane", "Palghar", "Raigad", "Ratnagiri", "Sindhudurg", "Nashik", "Dhule", "Nandurbar", "Jalgaon", "Ahmednagar", "Pune", "Satara", "Sangli", "Solapur", "Kolhapur", "Aurangabad", "Jalna", "Beed", "Latur", "Osmanabad", "Nanded", "Parbhani", "Hingoli", "Buldhana", "Akola", "Washim", "Amravati", "Yavatmal", "Wardha", "Nagpur", "Bhandara", "Gondia", "Chandrapur", "Gadchiroli"],
    cities: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Kalyan-Dombivli", "Vasai-Virar", "Aurangabad", "Navi Mumbai", "Solapur", "Mira-Bhayandar", "Bhiwandi", "Amravati", "Nanded", "Kolhapur", "Sangli", "Malegaon", "Jalgaon", "Akola", "Latur"]
}, {
    state: "Karnataka",
    districts: ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Yadgir"],
    cities: ["Bengaluru", "Mysuru", "Hubballi-Dharwad", "Mangaluru", "Belagavi", "Ballari", "Vijayapura", "Kalaburagi", "Davanagere", "Tumakuru", "Shivamogga", "Raichur", "Bidar", "Hassan", "Hospet", "Gadag-Betageri", "Robertson Pet", "Bhadravati", "Chitradurga", "Udupi"]
}, {
    state: "Tamil Nadu",
    districts: ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi", "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli", "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"],
    cities: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi", "Dindigul", "Thanjavur", "Ranipet", "Sivakasi", "Karur", "Udhagamandalam", "Hosur", "Nagercoil", "Kanchipuram", "Kumarapalayam"]
}, {
    state: "Gujarat",
    districts: ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur", "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad"],
    cities: ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Gandhidham", "Anand", "Navsari", "Morbi", "Nadiad", "Surendranagar", "Bharuch", "Mehsana", "Bhuj", "Porbandar", "Palanpur", "Valsad"]
}, {
    state: "Chandigarh", districts: ["Chandigarh"], cities: ["Chandigarh"]
}, {
    state: "Delhi", districts: ["Delhi"], cities: ["Delhi"]

}];

const validator = require('validator');


// Array of valid Indian states and union territories
const validIndianStates = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', // Union Territories
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'];

const addressSchema = new mongoose.Schema({
    addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        maxlength: [128, 'Address line 1 cannot be more than 128 characters'],
        trim: true
    },
    addressLine2: {
        type: String,
        maxlength: [128, 'Address line 2 cannot be more than 128 characters'],
        trim: true
    },
    landmark: {
        type: String,
        maxlength: [50, 'Landmark cannot be more than 50 characters'],
        trim: true
    },
    village: {
        type: String,
        maxlength: [50, 'Village cannot be more than 50 characters'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City/Town is required'],
        maxlength: [50, 'City cannot be more than 50 characters'],
        trim: true,
        validate: {
            validator: function(city) {
                const state = this.state;
                if (!state) return false;

                // Find the state data in the mapping
                const stateData = additionalLocationMappingData.find(data => data.state === state);
                if (!stateData) return false;

                // Check if city exists in the state's cities array
                return stateData.cities.includes(city);
            },
            message: props => `${props.value} is not a valid city for ${this.state}`
        }
    },
    district: {
        type: String,
        maxlength: [50, 'District cannot be more than 50 characters'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        enum: {values:validIndianStates, message: '{VALUE} is not a valid state'},
        trim: true
    },
    pincode: {
        type: String,
        required: [true, 'PIN code is required'],
        validate: {
            validator: function(v) {
                return /^[1-9][0-9]{5}$/.test(v);
            },
            message: 'Please enter a valid 6-digit PIN code'
        }
    }
});

module.exports = addressSchema;
