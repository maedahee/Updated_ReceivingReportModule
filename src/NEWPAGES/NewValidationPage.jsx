import React, { useState } from 'react';
import { collection, getDocs, query, where, getDoc, setDoc, doc } from "firebase/firestore";
//import { useLocation } from 'react-router-dom';
import db from "../firebase"; 
import { useEffect } from 'react';
import { writeBatch } from "firebase/firestore";


function ValidationPage() {
    const [purchaseOrderNo, setPurchaseOrderNo] = useState("");
    const [purchaseOrderItems, setPurchaseOrderItems] = useState([]);
    const [receivingReportNo, setReceivingReportNo] = useState(""); 
    const [receivingReportItems, setReceivingReportItems] = useState([]);
    const [allReceivingReports, setAllReceivingReports] = useState([]);
    const [allPurchaseOrders, setAllPurchaseOrders] = useState([]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && receivingReportNo) {
            handleSearchReceivingReport();
        }
        if (e.key === 'Enter' && purchaseOrderNo) {
            handleFetch();
        }
    };

    useEffect(() => {
    const fetchAllReceivingReports = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Receiving Report"));
        const allItems = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.items) {
            const itemsWithReportNo = data.items.map(item => ({
              ...item,
              receivingReportNo: docSnap.id,
            }));
            allItems.push(...itemsWithReportNo);
          }

        });
        setAllReceivingReports(allItems);

      } catch (error) {
        console.error("Error fetching all Receiving Reports:", error);
      }
    };

    if(receivingReportNo.trim() === "") {
      setReceivingReportItems(allReceivingReports);
    } else {
      const filteredItems = allReceivingReports.filter(item =>
        item.receivingReportNo
          .toLowerCase()
          .includes(receivingReportNo.toLowerCase()) ||
        item.itemName.toLowerCase().includes(receivingReportNo.toLowerCase())
      );
      setReceivingReportItems(filteredItems);
    }
     fetchAllReceivingReports();
  },[receivingReportNo, allReceivingReports]);

  useEffect(() => {
    const fetchAllPurchaseOrders = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Purchase Order"));
        const allPOs = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          allPOs.push({ id: docSnap.id, ...data });
        });

        setAllPurchaseOrders(allPOs);

      } catch (error) {
        console.error("Error fetching all Purchase Orders:", error);
      }
      if(purchaseOrderNo.trim() === "") {
        setPurchaseOrderItems(allPurchaseOrders);
      } else {
        const filteredItems = allPurchaseOrders.filter(item =>
          item.particulars.toLowerCase().includes(purchaseOrderNo.toLowerCase()) ||
          item.id.toLowerCase().includes(purchaseOrderNo.toLowerCase())
        );
        setPurchaseOrderItems(filteredItems);
      }
    };
    fetchAllPurchaseOrders();
  }, [purchaseOrderNo, allPurchaseOrders]);


  // Function to search for receiving reports by the receiving report number
  console.log("Receiving Report No:", receivingReportNo);
  console.log("Purchase Order No:", purchaseOrderNo);

  const handleSearchReceivingReport = async () => {
    const trimmedReportNo = receivingReportNo.trim();

    if (!trimmedReportNo) {
      alert("Please enter a Receiving Report Number.");
      return;
    }

    try {
      const reportRef = doc(db, "Receiving Report", trimmedReportNo);
      const reportSnap = await getDoc(reportRef);

      if (reportSnap.exists()) {
        const reportData = reportSnap.data();
        console.log("Fetched data:", reportData); // <-- Check structure
        const itemsWithReportNo = (reportData.items || []).map(item => ({
          ...item,
          receivingReportNo: trimmedReportNo,
        }));
        setReceivingReportItems(itemsWithReportNo);

      } else {
        alert(`No Receiving Report found with number: ${trimmedReportNo}`);
        setReceivingReportItems([]);
      }
    } catch (error) {
      console.error("Error searching for Receiving Report:", error);
      alert("Error fetching the Receiving Report.");
    }
  };

  const handleFetch = async () => {
    if (!purchaseOrderNo) {
      alert("Please enter a Purchase Order No.");
      return;
    }

    try {
      const purchaseOrderRef = collection(db, "Purchase Order");
      const q = query(purchaseOrderRef, where("poNumber", "==", purchaseOrderNo));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const items2 = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setPurchaseOrderItems(items2);
      } else {
        const qByName = query(purchaseOrderRef, where("name", "==", purchaseOrderNo)); 
        const querySnapshotByName = await getDocs(qByName);

        if (!querySnapshotByName.empty) {
          const items2 = querySnapshotByName.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setPurchaseOrderItems(items2);
        } else {
          alert("No Purchase Order found!");
          setPurchaseOrderItems([]);
        }
      }
    } catch (error) {
      console.error("Error searching for Purchase Order:", error);
    }
  };

  const handleResetRR = () => {
    setReceivingReportNo("");
    setReceivingReportItems(allReceivingReports);    
  };
  const handleResetPO = () => {
    setPurchaseOrderNo("");
    setPurchaseOrderItems(allPurchaseOrders);
  };

  const handleSave = async () => {
  const batch = writeBatch(db);

  try {
    // --- Save Receiving Report changes ---
    if (receivingReportItems.length > 0 && receivingReportNo) {
      const reportRef = doc(db, "Receiving Report", receivingReportNo);
      batch.set(reportRef, { items: receivingReportItems }, { merge: true });
      for (const item of receivingReportItems) {
        if (item.itemName) {
          const inventoryRef = doc(db, "Inventory", item.itemName);
          const updatedStock = (item.quantityAccepted || 0);

          batch.set(
            inventoryRef,
            {
              stock: updatedStock, 
              unit: item.unit,
              unitCost: item.unitCost,
              totalCost: updatedStock * item.unitCost,
              description: item.description,
            },
            { merge: true }
          );
        }
      }
    }

      await batch.commit();

      alert("All changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes.");
    }
  };
  
  const handleReceivingReportChange = async (index, value) => {
    try {
      const updatedItems = receivingReportItems.map((item, i) =>
        i === index ? { ...item, status: value } : item
      );
      setReceivingReportItems(updatedItems);
      const updatedItem = updatedItems[index];
      const reportRef = doc(db, "Receiving Report", updatedItem.receivingReportNo);

      const reportSnap = await getDoc(reportRef);
      if (reportSnap.exists()) {
        const reportData = reportSnap.data();
        const existingItems = reportData.items || [];

        const mergedItems = existingItems.map(item =>
          item.itemName === updatedItem.itemName ? updatedItem : item
        );

        await setDoc(reportRef, { items: mergedItems }, { merge: true });
      }
    } catch (error) {
      console.error("Error updating Receiving Report status:", error);
    }
  };


    const handlePurchaseOrderStatusChange = async (poIndex, itemIndex, value) => {
    try {
      const updatedPOs = purchaseOrderItems.map((po, i) => {
        if (i !== poIndex) return po;
        const updatedItems = po.items.map((item, j) =>
          j === itemIndex ? { ...item, status: value } : item
        );
        return { ...po, items: updatedItems };
      });
      setPurchaseOrderItems(updatedPOs);
      const po = updatedPOs[poIndex]; 
      const poRef = doc(db, "Purchase Order", po.id);
      await setDoc(poRef, { items: po.items }, { merge: true });
    } catch (error) {
      console.error("Error updating PO status:", error);
    }
  };

    const getStatusStyle = (status) => {
      switch (status) {
        case 'In Progress':
          return { backgroundColor: '#fff5cb' }; // Yellowish for "In Progress"
        case 'Completed':
          return { backgroundColor: '#d1fae5' }; // Green for "Completed"
        case 'Pending':
          return { backgroundColor: '#fee2e2' }; // Red for "Pending"
        default:
          return {}; // Default styles if no status is selected
      }
    };

    return (
    <>
    <div>
        <div className='grid grid-cols-3 md:grid-cols-2 gap-4 mt-5 ml-1.5 mr-5 justify-center px-4'>
            <div className='col-span-3 col-start-1 items-center rounded-lg border-1 border-black-200 ml-3 mt-5 items-center'>
                <h1 className='flex text-3xl pl-4 pt-8'>Receiving Report</h1>
                <div className='grid grid-cols-2 gap-4 m-4 mt-10'>
                    <div class='flex pt-2 pb-4 '>
                        <label className='text-black font-semibold flex-none mr-1 mt-2.5'>RR No:</label>
                        <input type='text' className='border border-gray-300 rounded-lg p-2 h-7 w-50 mt-2 ml-1.5 flex-initial' 
                        value={receivingReportNo} 
                        onChange={(e) => setReceivingReportNo(e.target.value)} 
                        onKeyDown={handleKeyDown} 
                        placeholder='Enter RR No'
                        />
                        <button className='border rounded-3xl w-25 bg-[#023047] text-white px-4 py-1 ml-6 mt-1.5' onClick={handleResetRR}>Reset</button>
                    </div>
                </div>

                <div className='overflow-y-scroll overscroll-auto h-60'>
                    <table className='border-collapse table-auto w-full text-sm text-left text-[#023047]'>
                        <thead class='text-xs text-white uppercase bg-[#023047]'>
                            <tr>
                                <th scope='col' class='px-4 py-3'>RR No</th>
                                <th scope='col' class='px-4 py-3 '>Item Name</th>
                                <th scope='col' class='px-4 py-3'>Description</th>
                                <th scope='col' class='px-4 py-3'>Quantity</th>
                                <th scope='col' class='px-4 py-3'>Unit</th>
                                <th scope='col' class='px-4 py-3'>Unit Cost</th>
                                <th scope='col' class='px-4 py-3'>Total Cost</th>
                                <th scope='col' class='px-5 py-3'>Status</th>
                            </tr>
                        </thead>
                       <tbody>
                        {receivingReportItems.length > 0 ? (
                            receivingReportItems.map((item, index) => (
                                <tr key={index} className='even:bg-gray-100 odd:bg-white'>
                                <td className='px-4 py-4'>{item.receivingReportNo || receivingReportNo}</td>
                                <td className='px-4 py-4'>{item.itemName}</td>
                                <td className='px-4 py-4'>{item.description}</td>
                                <td className='px-4  py-4'>{item.quantityAccepted}</td>
                                <td className='px-4 py-4'>{item.unit}</td>
                                <td className='px-4  py-4'>{item.unitCost}</td>
                                <td className='px-4  py-4'>{item.totalCost}</td>
                                <td>
                                  <select
                                      className='border border-gray-300 rounded-lg h-7 w-25 px-1 text-[#023047]'
                                      value={item.status || ''}
                                      onChange={(e) => handleReceivingReportChange(index, e.target.value)}
                                      style={getStatusStyle(item.status)}
                                  >
                                    <option className='bg-gray-100' value={''}>Select Status</option>
                                    <option className='bg-yellow-200' value={'In Progress'}>In Progress</option>
                                    <option className='bg-green-200' value={'Completed'}>Completed</option>
                                    <option className='bg-red-200' value={'Pending'}>Pending</option>
                                  </select>
                                </td>   
                                </tr>
                            ))
                            ) : (
                            <tr><td className='px-6 py-4'>No items found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
              
            <div className='col-span-3 col-start-1 items-center rounded-lg border-1 border-black-200 ml-3 mt-5'>
                <h1 className='flex text-3xl pl-4 pt-8'>Purchasing Order</h1>
                <div className='grid grid-cols-2 gap-4 m-4 mt-10'>
                    <div class='flex pt-2 pb-4'>
                        <label className='text-black font-semibold flex-none mr-2 mt-3'>PO No:</label>
                        <input type='text' className='border border-gray-300 rounded-lg mt-2.5 p-2 h-7.5 w-50 flex-initial' placeholder='Enter PO No' onKeyDown={handleKeyDown} value={purchaseOrderNo} onChange={(e) => setPurchaseOrderNo(e.target.value)}/>
                        <button className='border rounded-3xl w-25 bg-[#023047] text-white px-4 py-1 ml-6 mt-1.5' onClick={handleResetPO}>Reset</button>
                    </div>
                </div>

                <div className='overflow-y-scroll overscroll-auto h-60'>
                    <table className='border-collapse table-auto w-full text-sm text-left text-[#023047]'>
                        <thead class='text-xs text-white uppercase bg-[#023047]'>
                            <tr>
                                <th scope='col' class='px-6 py-3'>PO NO</th>
                                <th scope='col' class='px-6 py-3'>Description</th>
                                <th scope='col' class='px-6 py-3'>Quantity</th>
                                <th scope='col' class='px-6 py-3'>Unit</th>
                                <th scope='col' class='px-6 py-3'>Unit Cost</th>
                                <th scope='col' class='px-6 py-3'>Total Cost</th>
                                <th scope='col' class='px-6 py-3'>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {purchaseOrderItems.length > 0 ? (
                                purchaseOrderItems.map((po, index) => (
                                    po.items && po.items.length > 0 ? (
                                    po.items.map((item, itemIndex) => (
                                        <tr key={`${index}-${itemIndex}`} className='even:bg-gray-100 odd:bg-white'>
                                        <td className='px-6 py-4'>{po.id}</td> {/* Shows actual PO Number from document ID */}
                                        <td className='px-6 py-4'>{item.particulars}</td>
                                        <td className='px-6 py-4'>{item.quantity}</td>
                                        <td className='px-6 py-4'>{item.unit}</td>
                                        <td className='px-6 py-4'>{item.cost}</td>
                                        <td className='px-6 py-4'>{item.totalCost}</td>
                                        <td>
                                          <select
                                            className='border border-gray-300 rounded-lg h-7 w-25 px-1 text-[#023047]'
                                            value={item.status || ''}
                                            onChange={(e) => handlePurchaseOrderStatusChange(index, itemIndex, e.target.value)}
                                            style={getStatusStyle(item.status)}
                                          >
                                            <option className='bg-gray-100' value={''}>Select Status</option>
                                            <option className='bg-yellow-200' value={'In Progress'}>In Progress</option>
                                            <option className='bg-green-200' value={'Completed'}>Completed</option>
                                            <option className='bg-red-200' value={'Pending'}>Pending</option>
                                          </select>
                                        </td>
                                        </tr>
                                    ))
                                    ) : (
                                    <tr>
                                        <td className='px-6 py-4'>No items found in this PO</td>
                                    </tr>
                                    )
                                ))
                                ) : (
                                <tr><td className='px-6 py-4'>No Purchase Orders found</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className='flex justify-end pr-6 pt-4 pb-4'>
                    <button className='bg-[#023047] text-white font-semibold w-40 py-2 px-4 rounded-4xl mt-2' onClick={handleSave}>Update</button>
                </div>
            </div>
        </div>
    </div>
    </>
  )
}

export default ValidationPage;
