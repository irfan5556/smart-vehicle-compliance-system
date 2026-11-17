package com.smartvehicle.compliance.dto.response;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.*;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class RtoVehicleApiResponse {

    @JsonProperty("registration_number")
    @JsonAlias({"reg_no", "registration_no", "rc_number", "VehicleNumber"})
    private String registrationNumber;

    @JsonProperty("maker_model")
    @JsonAlias({"model", "vehicle_model", "maker_description", "makeAndModel"})
    private String makerModel;

    @JsonProperty("vehicle_class")
    @JsonAlias({"vehicle_type", "class", "vch_type", "body_type"})
    private String vehicleClass;

    @JsonProperty("insurance_upto")
    @JsonAlias({"insurance_expiry", "insurance_valid_upto", "insurance_upto_date", "insurance_validity"})
    private String insuranceUpto;

    @JsonProperty("insurance_company")
    @JsonAlias({"insurance_provider", "insurance_name", "insurer_name"})
    private String insuranceCompany;

    @JsonProperty("insurance_policy_number")
    @JsonAlias({"insurance_policy_no", "policy_no", "insurance_number"})
    private String insurancePolicyNumber;

    @JsonProperty("pucc_upto")
    @JsonAlias({"puc_upto", "puc_expiry", "pucc_valid_upto", "puc_validity"})
    private String puccUpto;

    @JsonProperty("pucc_number")
    @JsonAlias({"pucc_no", "puc_no", "pollution_cert_no"})
    private String puccNumber;

    @JsonProperty("road_tax_upto")
    @JsonAlias({"tax_upto", "mv_tax_upto", "tax_valid_upto"})
    private String roadTaxUpto;

    @JsonProperty("result")
    private Map<String, Object> nestedResult;

    @JsonProperty("data")
    private Map<String, Object> nestedData;

    /**
     * Helper to resolve maker_model checking root first, then nested objects if present.
     */
    public String resolveMakerModel() {
        if (makerModel != null && !makerModel.isBlank()) return makerModel.trim();
        return findInNested("maker_model", "model", "maker_description");
    }

    public String resolveInsuranceUpto() {
        if (insuranceUpto != null && !insuranceUpto.isBlank()) return insuranceUpto.trim();
        return findInNested("insurance_upto", "insurance_expiry", "insurance_valid_upto");
    }

    public String resolvePuccUpto() {
        if (puccUpto != null && !puccUpto.isBlank()) return puccUpto.trim();
        return findInNested("pucc_upto", "puc_upto", "puc_expiry");
    }

    public String resolveVehicleClass() {
        if (vehicleClass != null && !vehicleClass.isBlank()) return vehicleClass.trim();
        return findInNested("vehicle_class", "vehicle_type", "class");
    }

    public String resolveInsuranceCompany() {
        if (insuranceCompany != null && !insuranceCompany.isBlank()) return insuranceCompany.trim();
        return findInNested("insurance_company", "insurance_provider", "insurance_name");
    }

    public String resolveInsurancePolicyNumber() {
        if (insurancePolicyNumber != null && !insurancePolicyNumber.isBlank()) return insurancePolicyNumber.trim();
        return findInNested("insurance_policy_number", "insurance_policy_no", "policy_no");
    }

    public String resolvePuccNumber() {
        if (puccNumber != null && !puccNumber.isBlank()) return puccNumber.trim();
        return findInNested("pucc_number", "pucc_no", "puc_no");
    }

    public String resolveRoadTaxUpto() {
        if (roadTaxUpto != null && !roadTaxUpto.isBlank()) return roadTaxUpto.trim();
        return findInNested("road_tax_upto", "tax_upto", "mv_tax_upto");
    }

    private String findInNested(String... keys) {
        for (Map<String, Object> map : new Map[]{nestedResult, nestedData}) {
            if (map != null) {
                for (String key : keys) {
                    Object val = map.get(key);
                    if (val != null && !val.toString().isBlank()) {
                        return val.toString().trim();
                    }
                }
            }
        }
        return null;
    }
}

