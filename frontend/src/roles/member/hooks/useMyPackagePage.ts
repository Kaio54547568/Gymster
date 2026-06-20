import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/authService';
import { getInvoicesForMember } from '../../../services/invoiceApi';
import { createPackageChangeRequest, getCurrentMemberPackageForUser } from '../../../services/memberPackageApi';
import { getMemberReceipts } from '../../../services/memberReceiptApi';
import { fetchPackagesFromSupabase } from '../../../services/packageApi';
import { getPaymentsForMember } from '../../../services/paymentApi';
import { currentPackage, member } from '../domain/memberConstants';
import {
  type DisplayPackage,
  type DisplayTransaction,
  emptyDisplayCurrentPackage,
  mapCurrentPackageToDisplay,
  mapInvoiceToDisplayTransaction,
  mapPackageToDisplayPackage,
  mapPaymentToDisplayTransaction,
  mapReceiptToDisplayTransaction,
} from '../domain/packageTransactionMappers';

export function useMyPackagePage() {
  const [availablePackages, setAvailablePackages] = useState<DisplayPackage[]>([]);
  const [displayCurrentPackage, setDisplayCurrentPackage] = useState(emptyDisplayCurrentPackage);
  const [pendingPackage, setPendingPackage] = useState<any | null>(null);
  const [transactionRows, setTransactionRows] = useState<DisplayTransaction[]>([]);
  const [resolvedMemberId, setResolvedMemberId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DisplayPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [isLoadingMemberPackage, setIsLoadingMemberPackage] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const currentPackageIndex = availablePackages.findIndex((item) => item.title === displayCurrentPackage.title);
  const daysRemainingVal = typeof displayCurrentPackage.daysRemaining === 'number'
    ? displayCurrentPackage.daysRemaining
    : parseInt(String(displayCurrentPackage.daysRemaining || ''), 10);

  const hasMoreThan5DaysLeft = displayCurrentPackage.hasPackage &&
    String(displayCurrentPackage.status || '').toLowerCase() === 'active' &&
    !Number.isNaN(daysRemainingVal) &&
    daysRemainingVal > 5;

  const usagePercent = displayCurrentPackage.hasPackage && displayCurrentPackage.totalSessions > 0
    ? Math.min(100, Math.round((displayCurrentPackage.usedSessions / displayCurrentPackage.totalSessions) * 100))
    : 0;

  const canSubmitRequest = Boolean(selectedPackage && selectedPaymentMethod) && !pendingPackage;
  const filteredPackages = availablePackages.filter((item) => {
    const search = packageSearch.trim().toLowerCase();
    return !search || item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search);
  });

  const loadMemberPackageData = async () => {
    setIsLoadingMemberPackage(true);
    const currentUser = getCurrentUser();
    const [packagesResult, currentPackageResult, paymentsResult, invoicesResult, receiptsResult] = await Promise.allSettled([
      fetchPackagesFromSupabase(),
      getCurrentMemberPackageForUser(currentUser),
      getPaymentsForMember(currentUser),
      getInvoicesForMember(currentUser),
      getMemberReceipts(),
    ]);

    const packageData = packagesResult.status === 'fulfilled' ? packagesResult.value : { data: [], error: packagesResult.reason };
    const currentPackageData = currentPackageResult.status === 'fulfilled' ? currentPackageResult.value : { data: null, memberId: null, error: currentPackageResult.reason };
    const paymentsData = paymentsResult.status === 'fulfilled' ? paymentsResult.value : { data: [], error: paymentsResult.reason };
    const invoicesData = invoicesResult.status === 'fulfilled' ? invoicesResult.value : { data: [], error: invoicesResult.reason };
    const receiptsData = receiptsResult.status === 'fulfilled' ? { data: receiptsResult.value, error: null } : { data: [], error: receiptsResult.reason };

    if (!packageData.error && packageData.data.length) {
      setAvailablePackages(packageData.data.filter((pkg: any) => pkg.isActive !== false).map(mapPackageToDisplayPackage));
    } else {
      setAvailablePackages([]);
    }

    if (!currentPackageData.error && currentPackageData.data) {
      const item = currentPackageData.data;
      setResolvedMemberId(currentPackageData.memberId || item.memberId || null);
      setDisplayCurrentPackage(mapCurrentPackageToDisplay(item));
      setPendingPackage(currentPackageData.pendingPackage || null);
    } else {
      setResolvedMemberId(currentPackageData.memberId || null);
      setPendingPackage(currentPackageData.pendingPackage || null);
    }

    if (!receiptsData.error && receiptsData.data.length) {
      setTransactionRows(receiptsData.data.map(mapReceiptToDisplayTransaction));
    } else if (!invoicesData.error && invoicesData.data.length) {
      setTransactionRows(invoicesData.data.map(mapInvoiceToDisplayTransaction));
    } else if (!paymentsData.error && paymentsData.data.length) {
      setTransactionRows(paymentsData.data.map(mapPaymentToDisplayTransaction));
    } else {
      setTransactionRows([]);
    }

    if (packageData.error || currentPackageData.error || paymentsData.error || invoicesData.error || receiptsData.error) {
      console.warn("[Gymster Debug] Member package load errors:", {
        packageDataError: packageData.error,
        currentPackageDataError: currentPackageData.error,
        paymentsDataError: paymentsData.error,
        invoicesDataError: invoicesData.error,
        receiptsDataError: receiptsData.error,
      });
    }

    setLoadMessage(
      packageData.error || currentPackageData.error || paymentsData.error || invoicesData.error || receiptsData.error
        ? 'Some package data could not be loaded.'
        : ''
    );
    setIsLoadingMemberPackage(false);
  };

  useEffect(() => {
    loadMemberPackageData();
  }, []);

  const getPackageAction = (index: number, title: string) => {
    if (title === displayCurrentPackage.title) return 'Renew package';
    if (currentPackageIndex >= 0 && index > currentPackageIndex) return 'Upgrade package';
    return 'Select package';
  };

  const submitRenewalRequest = async () => {
    if (!selectedPackage || !selectedPaymentMethod) return;
    if (pendingPackage) {
      setRequestMessage('You already have a package waiting for activation. You cannot buy another package yet.');
      return;
    }
    const currentUser = getCurrentUser();
    const requestPayload = {
      memberId: resolvedMemberId || currentUser?.memberId || currentUser?.member_id || '',
      memberEmail: currentUser?.email || '',
      memberName: currentUser?.fullName || currentUser?.full_name || member.name,
      currentPackageName: displayCurrentPackage.hasPackage ? displayCurrentPackage.title : 'No active package',
      packageId: selectedPackage.id,
      packageName: selectedPackage.title,
      amount: selectedPackage.priceValue,
      paymentMethod: selectedPaymentMethod,
      requestType: !displayCurrentPackage.hasPackage ? 'buy' : selectedPackage.title === displayCurrentPackage.title ? 'renewal' : 'upgrade',
    };

    const { data, error } = await createPackageChangeRequest(requestPayload);

    if (!error && data) {
      setRequestMessage(`Request ${data.requestId} submitted for staff approval.`);
      return;
    }

    setRequestMessage(error?.message || 'Request could not be saved.');
  };

  return {
    canSubmitRequest,
    displayCurrentPackage,
    filteredPackages,
    getPackageAction,
    isLoadingMemberPackage,
    loadMessage,
    packageSearch,
    pendingPackage,
    requestMessage,
    selectedPackage,
    selectedPaymentMethod,
    setPackageSearch,
    setSelectedPackage,
    setSelectedPaymentMethod,
    submitRenewalRequest,
    transactionRows,
    usagePercent,
    hasMoreThan5DaysLeft,
    refetchData: loadMemberPackageData,
  };
}
