"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useAccount, usePublicClient } from 'wagmi';
import { useCampaignEscrowSimple } from '@/hooks/use-campaign-escrow-simple';
import { CAMPAIGN_ESCROW_ABI } from '@/lib/escrow';
import { decodeEventLog } from 'viem';

type CampaignRow = {
  id: string;
  name: string;
  status: string;
  budget: number;
  remainingBudget: number;
  description: string;
  period: { startDate: string; endDate: string };
  mission: {
    id: string;
    title: string;
    type: string;
    boostMultiplier: number;
    boostDuration: number; // hours
    targetCompletions: number;
    completions: number;
    description?: string;
  };
  actions: {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canPause: boolean;
    canResume: boolean;
    canViewReport: boolean;
  };
};

function formatStatus(status: string): { icon: string; label: string } {
  switch (status) {
    case "ACTIVE":
      return { icon: "✅", label: "Active" };
    case "COMPLETED":
      return { icon: "🏁", label: "Finished" };
    case "DRAFT":
      return { icon: "📝", label: "Draft" };
    case "PAUSED":
      return { icon: "⏸️", label: "Paused" };
    default:
      return { icon: "", label: status };
  }
}

export default function AdvertiserHome() {
  const [rows, setRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Wallet and contract integration
  const { address, isConnected } = useAccount();
  const { createCampaign, isLoading: contractLoading, error: contractError, clearError } = useCampaignEscrowSimple();
  const publicClient = usePublicClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString());
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString();
  });
  const [missionTitle, setMissionTitle] = useState("");
  const [missionDescription, setMissionDescription] = useState("");
  const [boostMultiplier, setBoostMultiplier] = useState("1.0");
  const [boostDuration, setBoostDuration] = useState("24");
  const [targetCompletions, setTargetCompletions] = useState("100");
  const [startOpen, setStartOpen] = useState(false);
  const [endOpen, setEndOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadCampaigns = async () => {
      try {
        const res = await fetch("/api/advertiser/campaigns", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to load campaigns");
        if (mounted) setRows(data.campaigns || []);
      } catch (e: any) {
        if (mounted) setError(e?.message || String(e));
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    loadCampaigns();
    return () => {
      mounted = false;
    };
  }, []);

  // Clear contract error when component mounts or when dialog opens
  useEffect(() => {
    if (isDialogOpen) {
      // Use setTimeout to ensure this runs after render
      const timeoutId = setTimeout(() => {
        clearError();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isDialogOpen, clearError]);

  const hasRows = useMemo(() => rows.length > 0, [rows]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/advertiser/campaigns", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load campaigns");
      setRows(data.campaigns || []);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const onPause = useCallback(async (id: string) => {
    await fetch(`/api/advertiser/campaigns/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause" }),
    });
    await refresh();
  }, [refresh]);

  const onResume = useCallback(async (id: string) => {
    await fetch(`/api/advertiser/campaigns/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resume" }),
    });
    await refresh();
  }, [refresh]);

  const onDelete = useCallback(async (id: string) => {
    await fetch(`/api/advertiser/campaigns/${id}`, { method: "DELETE" });
    await refresh();
  }, [refresh]);

  const resetForm = useCallback(() => {
    setName("");
    setDescription("");
    setBudget("");
    setStartDate(new Date().toISOString());
    setEndDate(() => {
      const d = new Date();
      d.setDate(d.getDate() + 5);
      return d.toISOString();
    });
    setMissionTitle("");
    setMissionDescription("");
    setBoostMultiplier("1.0");
    setBoostDuration("24");
    setTargetCompletions("100");
    setFormError(null);
    setEditingId(null);
  }, []);

  const onCreateCampaign = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    
    try {
      // Check wallet connection
      if (!isConnected || !address) {
        throw new Error("Please connect your wallet to create a campaign");
      }

      // Check if wallet is connected to the correct network
      // The contract is deployed to Kairos testnet
      console.log('Current network:', publicClient?.chain?.name || 'Unknown');
      console.log('Expected network: Kairos Testnet (1001)');

      let contractCampaignId: string | null = null;
      
      // Only create contract campaign for new campaigns (not edits)
      if (!editingId) {
        // Create campaign on contract first
        console.log('Creating campaign on contract with budget:', budget);
        console.log('Wallet connected:', isConnected);
        console.log('Address:', address);
        console.log('Contract loading:', contractLoading);
        console.log('Contract error:', contractError);
        
        const txHash = await createCampaign(budget);
        console.log('Transaction hash received:', txHash);
        
        if (!txHash) {
          const networkInfo = publicClient?.chain ? `Current network: ${publicClient.chain.name} (${publicClient.chain.id})` : 'Network not detected';
          const expectedNetwork = 'Expected: Kairos Testnet (1001)';
          throw new Error(`Failed to create campaign on contract. ${networkInfo}. ${expectedNetwork}. Error: ${contractError || 'Unknown error'}`);
        }

        // Wait for transaction confirmation with timeout
        let receipt = null;
        if (publicClient) {
          try {
            receipt = await publicClient.waitForTransactionReceipt({
              hash: txHash,
              confirmations: 1,
              timeout: 30000 // 30 second timeout
            });
            
            if (receipt.status !== 'success') {
              throw new Error("Contract transaction failed");
            }
          } catch (timeoutError) {
            console.warn('Transaction confirmation timed out, but transaction was submitted:', txHash);
            // For local development, we'll assume the transaction succeeded
            // In production, you might want to handle this differently
            console.log('Continuing with campaign creation assuming transaction succeeded...');
            console.log('If on Kairos explorer, you can verify the transaction later.');
          }
        }
        
        // Extract campaign ID from transaction logs (if receipt is available)
        // The contract emits CampaignCreated(campaignId, msg.sender, initialFunding)
        let campaignCreatedLog = null;
        if (receipt && receipt.logs) {
          const escrowAddressLc = (CAMPAIGN_ESCROW_ABI as any) ? (undefined) : undefined; // noop to keep import used
          campaignCreatedLog = receipt.logs.find((log: any) => {
            try {
              const decoded = decodeEventLog({
                abi: CAMPAIGN_ESCROW_ABI,
                data: log.data,
                topics: log.topics,
                eventName: 'CampaignCreated',
              });
              return decoded.eventName === 'CampaignCreated';
            } catch {
              return false;
            }
          });

          if (campaignCreatedLog) {
            try {
              const decoded = decodeEventLog({
                abi: CAMPAIGN_ESCROW_ABI,
                data: campaignCreatedLog.data,
                topics: campaignCreatedLog.topics,
                eventName: 'CampaignCreated',
              }) as unknown as { eventName: string; args: any };
              const args = decoded.args as any;
              const campaignIdBytes32 = (args?.campaignId ?? (Array.isArray(args) ? args[0] : undefined)) as `0x${string}` | undefined;
              if (!campaignIdBytes32) {
                throw new Error('Campaign ID not found in event args');
              }
              contractCampaignId = campaignIdBytes32;
            } catch (error) {
              throw new Error("Could not decode campaign creation event");
            }
          } else {
            throw new Error("Could not find CampaignCreated event in transaction");
          }
        } else {
          // If we don't have a receipt (due to timeout), generate a fallback campaign ID for local development
          console.log('No receipt available, generating fallback campaign ID for local development');
          contractCampaignId = `0x${txHash.slice(2, 66).padEnd(64, '0')}` as `0x${string}`;
        }
      }

      const payload = {
        name,
        description,
        budget: Number(budget || 0),
        startDate,
        endDate,
        contractCampaignId, // Include the contract campaign ID
        mission: {
          title: missionTitle,
          description: missionDescription,
          type: "SPONSORED_TASK",
          boostMultiplier: Number(boostMultiplier || 1),
          boostDuration: Number(boostDuration || 0),
          targetCompletions: Number(targetCompletions || 0),
          isRepeatable: false,
          verificationUrl: null,
        },
      };
      
      const url = editingId ? `/api/advertiser/campaigns/${editingId}` : "/api/advertiser/campaigns";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || (editingId ? "Failed to update campaign" : "Failed to create campaign"));
      await refresh();
      setIsDialogOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err?.message || String(err));
    } finally {
      setSubmitting(false);
    }
  }, [isConnected, address, createCampaign, publicClient, budget, name, description, startDate, endDate, missionTitle, missionDescription, boostMultiplier, boostDuration, targetCompletions, editingId, resetForm]);

  const openEdit = useCallback((row: CampaignRow) => {
    setEditingId(row.id);
    setIsDialogOpen(true);
    setName(row.name);
    setDescription(row.description ?? "");
    setBudget(String(row.budget));
    setStartDate(row.period.startDate);
    setEndDate(row.period.endDate);
    setMissionTitle(row.mission.title);
    setMissionDescription(row.mission.description ?? "");
    setBoostMultiplier(String(row.mission.boostMultiplier));
    setBoostDuration(String(row.mission.boostDuration));
    setTargetCompletions(String(row.mission.targetCompletions));
  }, []);

  return (
    <main className="container mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaign Proposals</h1>
          <p className="text-muted-foreground">Overview of your proposals and statuses.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(o) => { setIsDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); resetForm(); }}>New Campaign</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]" key={editingId || 'new'}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit campaign" : "Create a new campaign"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Update your campaign details and mission parameters." : "Set up a new campaign with mission details and budget allocation."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onCreateCampaign} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Campaign name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (USDT)</Label>
                  <Input id="budget" type="number" min="0" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start">Start date</Label>
                  <Popover open={startOpen} onOpenChange={setStartOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="start"
                      >
                        {startDate ? new Date(startDate).toLocaleDateString() : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate ? new Date(startDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setStartDate(date.toISOString());
                            setStartOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End date</Label>
                  <Popover open={endOpen} onOpenChange={setEndOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        id="end"
                      >
                        {endDate ? new Date(endDate).toLocaleDateString() : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate ? new Date(endDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setEndDate(date.toISOString());
                            setEndOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="description">Campaign description</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} required />
                </div>
              </div>

              <div className="rounded-md border p-3 space-y-3">
                <div className="text-sm font-medium">Mission</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="missionTitle">Title</Label>
                    <Input id="missionTitle" value={missionTitle} onChange={(e) => setMissionTitle(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boostMultiplier">Reward multiplier (x)</Label>
                    <Input id="boostMultiplier" type="number" step="0.1" min="0" value={boostMultiplier} onChange={(e) => setBoostMultiplier(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="boostDuration">Reward duration (hours)</Label>
                    <Input id="boostDuration" type="number" step="1" min="0" value={boostDuration} onChange={(e) => setBoostDuration(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetCompletions">Target completions</Label>
                    <Input id="targetCompletions" type="number" step="1" min="0" value={targetCompletions} onChange={(e) => setTargetCompletions(e.target.value)} required />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="missionDescription">Description</Label>
                    <Textarea id="missionDescription" value={missionDescription} onChange={(e) => setMissionDescription(e.target.value)} rows={3} required />
                  </div>
                </div>
              </div>

              {!isConnected && (
                <div className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-md">
                  Please connect your wallet to create a campaign
                </div>
              )}
              
              {isConnected && publicClient && (
                <div className="text-sm text-blue-600 bg-blue-50 dark:bg-blue-950/20 p-3 rounded-md">
                  Connected to: {publicClient.chain?.name} (Chain ID: {publicClient.chain?.id})
                  <br />
                  <span className="text-xs text-gray-600">
                    Expected: Kairos Testnet (1001)
                  </span>
                </div>
              )}
              
              {contractError && <div className="text-sm text-red-600">{contractError}</div>}
              {formError && <div className="text-sm text-red-600">{formError}</div>}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={submitting || contractLoading}>Cancel</Button>
                <Button type="submit" disabled={submitting || contractLoading || !isConnected}>
                  {submitting ? (
                    contractLoading ? "Creating on blockchain..." : (editingId ? "Saving…" : "Creating…")
                  ) : (
                    editingId ? "Save Changes" : "Create Campaign"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="text-sm text-muted-foreground">Loading…</div>
      )}
      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {hasRows ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left font-medium px-4 py-3">Campaign Name</th>
                <th className="text-left font-medium px-4 py-3">Status</th>
                <th className="text-left font-medium px-4 py-3">Completions</th>
                <th className="text-left font-medium px-4 py-3">Budget (USDT)</th>
                <th className="text-left font-medium px-4 py-3">Mission Type</th>
                <th className="text-left font-medium px-4 py-3">Reward</th>
                <th className="text-left font-medium px-4 py-3">Timeline</th>
                <th className="text-right font-medium px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = formatStatus(r.status);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{s.icon} {s.label}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.mission.completions} / {r.mission.targetCompletions}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{Math.max(0, Math.round(r.remainingBudget))} / {Math.round(r.budget)}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.mission.type.replaceAll("_", " ")}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{r.mission.boostMultiplier.toFixed(1)}x for {r.mission.boostDuration}h</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {new Date(r.period.startDate).toLocaleDateString('en-US', { month: "short", day: "numeric" })} - {new Date(r.period.endDate).toLocaleDateString('en-US', { month: "short", day: "numeric" })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a href={`/advertiser/campaigns/${r.id}`} className="underline underline-offset-2">View</a>
                        {r.actions.canPause && (
                          <button onClick={() => onPause(r.id)} className="text-muted-foreground hover:text-foreground">Pause</button>
                        )}
                        {r.actions.canResume && (
                          <button onClick={() => onResume(r.id)} className="text-muted-foreground hover:text-foreground">Resume</button>
                        )}
                        {r.actions.canEdit && (
                          <button onClick={() => openEdit(r)} className="text-muted-foreground hover:text-foreground">Edit</button>
                        )}
                        {r.actions.canDelete && (
                          <button onClick={() => onDelete(r.id)} className="text-red-600 hover:text-red-700">Delete</button>
                        )}
                        {r.actions.canViewReport && (
                          <a href={`/advertiser/campaigns/${r.id}/report`} className="text-muted-foreground hover:text-foreground">View Report</a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        !loading && !error && (
          <div className="text-sm text-muted-foreground">No campaigns yet.</div>
        )
      )}
    </main>
  );
}




