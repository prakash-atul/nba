import { useState, useEffect } from "react";
import { adminApi } from "@/services/api/admin";
import { Phone, Loader2 } from "lucide-react";

export function UserPhonesRow({ employeeId }: { employeeId: number }) {
        const [phones, setPhones] = useState<string[]>([]);
        const [loading, setLoading] = useState(true);

        useEffect(() => {
                let isMounted = true;
                const fetchPhones = async () => {
                        try {
                                const data = await adminApi.getUserPhones(employeeId);
                                if (isMounted) {
                                        setPhones(data || []);
                                        setLoading(false);
                                }
                        } catch (error) {
                                console.error("Failed to fetch user phones:", error);
                                if (isMounted) setLoading(false);
                        }
                };
                fetchPhones();
                return () => {
                        isMounted = false;
                };
        }, [employeeId]);

        if (loading) {
                return (
                        <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                <span className="text-sm text-muted-foreground">
                                        Loading contact details...
                                </span>
                        </div>
                );
        }

        return (
                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 border-t">
                        <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Phone className="h-4 w-4" />
                                Contact Numbers
                        </div>
                        {phones.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                        {phones.map((phone, idx) => (
                                                <div
                                                        key={idx}
                                                        className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm"
                                                >
                                                        <span className="text-xs text-muted-foreground">
                                                                #{idx + 1}
                                                        </span>
                                                        <span className="font-mono text-sm">{phone}</span>
                                                </div>
                                        ))}
                                </div>
                        ) : (
                                <div className="text-sm text-muted-foreground italic">
                                        No contact numbers found for this user.
                                </div>
                        )}
                </div>
        );
}
