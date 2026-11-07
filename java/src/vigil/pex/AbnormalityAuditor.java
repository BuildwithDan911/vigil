package vigil.pex;

import java.util.*;

/**
 * AbnormalityAuditor - InterSystems PEX Business Operation
 * Independently audits laboratory OBX abnormal flags and referral risks.
 * (c) 2026 Daniel John <danielbasseyj@gmail.com> - MIT License
 */
public class AbnormalityAuditor {

    public static class AuditResult {
        public boolean agree;
        public int auditScore;
        public String auditor;
        public List<String> flaggedAbnormalities;

        public AuditResult(boolean agree, int auditScore, String auditor, List<String> flaggedAbnormalities) {
            this.agree = agree;
            this.auditScore = auditScore;
            this.auditor = auditor;
            this.flaggedAbnormalities = flaggedAbnormalities;
        }
    }

    public static AuditResult auditLabResult(String abnormalFlags, int pythonAbnormalityScore) {
        List<String> flags = new ArrayList<>();
        int calculatedAbnormality = 0;

        if (abnormalFlags != null && !abnormalFlags.trim().isEmpty()) {
            String[] tokens = abnormalFlags.split("[,;| ]+");
            for (String t : tokens) {
                String upper = t.trim().toUpperCase();
                if (upper.equals("HH") || upper.equals("LL") || upper.equals("PANIC") || upper.equals("CRITICAL")) {
                    calculatedAbnormality = Math.max(calculatedAbnormality, 5);
                    flags.add(upper);
                } else if (upper.equals("H") || upper.equals("L") || upper.equals("A")) {
                    calculatedAbnormality = Math.max(calculatedAbnormality, 3);
                    flags.add(upper);
                }
            }
        }

        boolean agree = (calculatedAbnormality == pythonAbnormalityScore);
        return new AuditResult(agree, calculatedAbnormality, "Java-PEX-AbnormalityAuditor-v1", flags);
    }
}
