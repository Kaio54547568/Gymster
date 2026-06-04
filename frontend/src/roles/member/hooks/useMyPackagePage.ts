import { useEffect, useState } from 'react';
import { getCurrentUser } from '../../../services/authService';
import { getInvoicesForMember } from '../../../services/invoiceApi';
import { createPackageChangeRequest, getCurrentMemberPackageForUser } from '../../../services/memberPackageApi';
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
} from '../domain/packageTransactionMappers';

export function useMyPackagePage() {
  const [availablePackages, setAvailablePackages] = useState<DisplayPackage[]>([]);
  const [displayCurrentPackage, setDisplayCurrentPackage] = useState(emptyDisplayCurrentPackage);
  const [transactionRows, setTransactionRows] = useState<DisplayTransaction[]>([]);
  const [resolvedMemberId, setResolvedMemberId] = useState<string | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<DisplayPackage | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [packageSearch, setPackageSearch] = useState('');
  const [isLoadingMemberPackage, setIsLoadingMemberPackage] = useState(true);
  const [loadMessage, setLoadMessage] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const currentPackageIndex = availablePackages.findIndex((item) => item.title === displayCurrentPackage.title);
  const usagePercent = displayCurrentPackage.hasPackage && displayCurrentPackage.totalSessions > 0
    ? Math.min(100, Math.round((displayCurrentPackage.usedSessions / displayCurrentPackage.totalSessions) * 100))
    : 0;
  const canSubmitRequest = Boolean(selectedPackage && selectedPaymentMethod);
  const filteredPackages = availablePackages.filter((item) => {
    const search = packageSearch.trim().toLowerCase();
    return !search || item.title.toLowerCase().includes(search) || item.description.toLowerCase().includes(search);
  });

  useEffect(() => {
    let isMounted = true;
    const currentUser = getCurrentUser();

    async function loadMemberPackageData() {
      setIsLoadingMemberPackage(true);
      const [packagesResult, currentPackageResult, paymentsResult, invoicesResult] = await Promise.all([
        fetchPackagesFromSupabase(),
        getCurrentMemberPackageForUser(currentUser),
        getPaymentsForMember(currentUser),
        getInvoicesForMember(currentUser),
      ]);

      if (!isMounted) return;

      if (!packagesResult.error && packagesResult.data.length) {
        setAvailablePackages(packagesResult.data.filter((pkg: any) => pkg.isActive !== false).map(mapPackageToDisplayPackage));
      } else {
        setAvailablePackages([]);
      }

      if (!currentPackageResult.error && currentPackageResult.data) {
        const item = currentPackageResult.data;
        setResolvedMemberId(currentPackageResult.memberId || item.memberId || null);
        setDisplayCurrentPackage(mapCurrentPackageToDisplay(item));
      } else {
        setResolvedMemberId(currentPackageResult.memberId || null);
      }

      if (!invoicesResult.error && invoicesResult.data.length) {
        setTransactionRows(invoicesResult.data.map(mapInvoiceToDisplayTransaction));
      } else if (!paymentsResult.error && paymentsResult.data.length) {
        setTransactionRows(paymentsResult.data.map(mapPaymentToDisplayTransaction));
      } else {
        setTransactionRows([]);
      }

      setLoadMessage(
        packagesResult.error || currentPackageResult.error || paymentsResult.error || invoicesResult.error
          ? 'Some package data could not be loaded.'
          : ''
      );
      setIsLoadingMemberPackage(false);
    }

    loadMemberPackageData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getPackageAction = (index: number, title: string) => {
    if (title === displayCurrentPackage.title) return 'Renew package';
    if (currentPackageIndex >= 0 && index > currentPackageIndex) return 'Upgrade package';
    return 'Select package';
  };

  const submitRenewalRequest = async () => {
    if (!selectedPackage || !selectedPaymentMethod) return;
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

    setRequestMessage('Request could not be saved.');
  };

  return {
    canSubmitRequest,
    displayCurrentPackage,
    filteredPackages,
    getPackageAction,
    isLoadingMemberPackage,
    loadMessage,
    packageSearch,
    requestMessage,
    selectedPackage,
    selectedPaymentMethod,
    setPackageSearch,
    setSelectedPackage,
    setSelectedPaymentMethod,
    submitRenewalRequest,
    transactionRows,
    usagePercent,
  };
}
