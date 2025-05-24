import { useState, useEffect, useRef } from 'react';
import { MaterialIcons } from './MaterialIcons';
import html2canvas from 'html2canvas';

const SettlementCalculator = () => {
  const [mode, setMode] = useState('direct');
  const [items, setItems] = useState([{ id: 1, name: '', quantity: 1, price: 0, peopleCount: 1, selectedPeople: [1] }]);
  const [numPeople, setNumPeople] = useState(1);
  const [totalAmount, setTotalAmount] = useState(0);
  const [amountPerPerson, setAmountPerPerson] = useState({});
  const [showPeopleModal, setShowPeopleModal] = useState(false);
  const [currentItemId, setCurrentItemId] = useState(null);
  const [showTodoModal, setShowTodoModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const imageRef = useRef(null);

  const addItem = () => {
    setItems([...items, {
      id: Date.now(),
      name: '',
      quantity: 1,
      price: 0,
      peopleCount: numPeople,
      selectedPeople: Array.from({ length: numPeople }, (_, i) => i + 1)
    }]);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const togglePersonSelection = (itemId, personNumber) => {
    setItems(items.map(item => {
      if (item.id === itemId) {
        const newSelectedPeople = item.selectedPeople.includes(personNumber)
          ? item.selectedPeople.filter(p => p !== personNumber)
          : [...item.selectedPeople, personNumber].sort((a, b) => a - b);
        return {
          ...item,
          selectedPeople: newSelectedPeople,
          peopleCount: newSelectedPeople.length
        };
      }
      return item;
    }));
  };

  const openPeopleModal = (itemId) => {
    setCurrentItemId(itemId);
    setShowPeopleModal(true);
  };

  const closePeopleModal = () => {
    setShowPeopleModal(false);
    setCurrentItemId(null);
  };

  const updateTotals = () => {
    const grandTotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    setTotalAmount(grandTotal);

    // 각 인원별 정산 금액 계산
    const personAmounts = {};
    for (let i = 1; i <= numPeople; i++) {
      personAmounts[i] = items.reduce((sum, item) => {
        if (item.selectedPeople.includes(i)) {
          // 해당 인원이 선택된 항목들의 금액을 인원 수로 나눔
          return sum + Math.ceil((item.price * item.quantity) / item.selectedPeople.length);
        }
        return sum;
      }, 0);
    }
    setAmountPerPerson(personAmounts);
  };

  useEffect(() => {
    updateTotals();
  }, [items, numPeople]);

  const incrementNumPeople = () => {
    const newNumPeople = numPeople + 1;
    setNumPeople(newNumPeople);
    setItems(items.map(item => ({
      ...item,
      peopleCount: newNumPeople,
      selectedPeople: [...item.selectedPeople, newNumPeople]
    })));
  };

  const decrementNumPeople = () => {
    if (numPeople > 1) {
      const newNumPeople = numPeople - 1;
      setNumPeople(newNumPeople);
      setItems(items.map(item => ({
        ...item,
        peopleCount: newNumPeople,
        selectedPeople: item.selectedPeople.filter(p => p <= newNumPeople)
      })));
    }
  };

  const handleSaveImage = async () => {
    if (imageRef.current) {
      try {
        const canvas = await html2canvas(imageRef.current, {
          backgroundColor: '#F2F4F6',
          scale: 2,
        });
        const image = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = image;
        link.download = '정산내역.png';
        link.click();
      } catch (error) {
        console.error('이미지 저장 중 오류 발생:', error);
      }
    }
  };

  const handleShareImage = async () => {
    if (imageRef.current) {
      try {
        const canvas = await html2canvas(imageRef.current, {
          backgroundColor: '#F2F4F6',
          scale: 2,
        });
        const image = canvas.toDataURL('image/png');
        
        // 이미지를 Blob으로 변환
        const response = await fetch(image);
        const blob = await response.blob();
        
        // Web Share API 사용
        if (navigator.share) {
          const file = new File([blob], '정산내역.png', { type: 'image/png' });
          await navigator.share({
            title: '정산 내역',
            text: '정산 내역을 공유합니다.',
            files: [file]
          });
        } else {
          // Web Share API를 지원하지 않는 경우 다운로드 링크 생성
          const link = document.createElement('a');
          link.href = image;
          link.download = '정산내역.png';
          link.click();
        }
      } catch (error) {
        console.error('이미지 공유 중 오류 발생:', error);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white p-4 shadow-sm max-w-md mx-auto w-full">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-bold text-gray-800 text-center">정산하기</h1>
        </div>
      </header>

      <main className="flex-grow w-full max-w-md mx-auto bg-white">
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-3 px-4 text-center text-sm focus:outline-none ${
              mode === 'direct' ? 'tab-active' : 'tab-inactive'
            }`}
            onClick={() => setMode('direct')}
          >
            직접 입력
          </button>
          <button
            className={`flex-1 py-3 px-4 text-center text-sm focus:outline-none ${
              mode === 'receipt' ? 'tab-active' : 'tab-inactive'
            }`}
            onClick={() => setShowTodoModal(true)}
          >
            영수증 인식 <span className="text-xs text-gray-400">(TODO)</span>
          </button>
        </div>

        <div className="p-5 w-full">
          {mode === 'receipt' ? (
            <div>
              <div className="bg-gray-50 rounded-lg p-6 text-center">
                <span className="material-icons text-6xl text-gray-400 mb-4">receipt_long</span>
                <p className="text-gray-600 mb-6">영수증 이미지를 올리면 항목을 자동으로 입력해줘요.</p>
                <button className="toss-button w-full flex items-center justify-center">
                  <span className="material-icons mr-2">photo_camera</span>
                  이미지 업로드
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3 mb-6 min-w-full">
                {items.map(item => (
                  <div key={item.id} className="item p-4 bg-gray-50 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex-grow flex items-center gap-2 min-w-0">
                        <input
                          type="text"
                          placeholder="항목 이름 (예: 저녁 식사)"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="item-name-input text-base font-medium flex-grow p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 min-w-0"
                        />
                        <div className="flex items-center space-x-1 text-xs text-gray-500 shrink-0">
                          <span className="material-icons text-lg text-gray-400">group</span>
                          <button
                            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent"
                            onClick={() => openPeopleModal(item.id)}
                          >
                            <span className="text-sm font-medium">{item.peopleCount}명</span>
                          </button>
                        </div>
                        <button
                          className="text-red-500 hover:text-red-600 focus:outline-none shrink-0"
                          onClick={() => removeItem(item.id)}
                        >
                          <span className="material-icons text-xl">delete_outline</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between space-x-2">
                      <div className="relative flex-1">
                        <input
                          type="number"
                          placeholder="단가"
                          min="0"
                          value={item.price}
                          onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="item-price w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm text-right"
                          title="단가"
                        />
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent"
                          onClick={() => {
                            if (item.quantity > 1) {
                              updateItem(item.id, 'quantity', item.quantity - 1);
                            }
                          }}
                        >
                          <span className="material-icons text-lg">remove_circle_outline</span>
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                          className="item-quantity w-10 p-1 border border-gray-300 rounded-md text-center focus:ring-blue-500 focus:border-blue-500 text-sm quantity-input"
                        />
                        <button
                          className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none bg-transparent"
                          onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}
                        >
                          <span className="material-icons text-lg">add_circle_outline</span>
                        </button>
                      </div>
                      <div className="w-24 text-right text-sm font-medium text-gray-700">
                        ₩ {(item.price * item.quantity).toLocaleString()}원
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                className="w-full toss-secondary-button flex items-center justify-center text-sm mb-6"
                onClick={addItem}
              >
                <span className="material-icons mr-1 text-base">add_circle_outline</span>
                항목 추가
              </button>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <label className="text-base font-medium text-gray-700">참여 인원:</label>
                  <div className="flex items-center">
                    <button
                      className="p-1 text-blue-500 hover:text-blue-700 focus:outline-none bg-transparent"
                      onClick={decrementNumPeople}
                    >
                      <span className="material-icons">remove_circle</span>
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={numPeople}
                      onChange={(e) => setNumPeople(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 p-1 border-b border-gray-300 text-center focus:ring-blue-500 focus:border-blue-500 quantity-input text-base"
                    />
                    <button
                      className="p-1 text-blue-500 hover:text-blue-700 focus:outline-none bg-transparent"
                      onClick={incrementNumPeople}
                    >
                      <span className="material-icons">add_circle</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-base text-gray-700 mb-4">
                  <span>총 금액</span>
                  <span className="font-bold text-lg">₩ {totalAmount.toLocaleString()}원</span>
                </div>
                <div className="space-y-2">
                  {Object.entries(amountPerPerson).map(([personNumber, amount]) => (
                    <div key={personNumber} className="flex justify-between items-center text-base">
                      <span className="text-gray-700">{personNumber}번 정산 금액</span>
                      <span className="font-medium text-blue-600">{amount.toLocaleString()}원</span>
                    </div>
                  ))}
                </div>

                {/* Image Preview Modal */}
                {showImageModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">이미지 미리보기</h3>
                        <button
                          className="text-gray-500 hover:text-gray-700"
                          onClick={() => setShowImageModal(false)}
                        >
                          <span className="material-icons">close</span>
                        </button>
                      </div>
                      <div ref={imageRef} className="bg-[#F2F4F6] p-4 rounded-lg">
                        <div className="space-y-4">
                          <div className="text-lg font-bold text-center mb-4">정산 내역</div>
                          {items.map(item => (
                            <div key={item.id} className="bg-white p-3 rounded-lg">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-medium">{item.name || '품목 이름'}</span>
                                <span className="text-gray-600">{item.quantity}개</span>
                              </div>
                              <div className="text-right text-gray-700">
                                ₩ {(item.price * item.quantity).toLocaleString()}원
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                참여: {item.selectedPeople.map(p => `${p}번`).join(', ')}
                              </div>
                            </div>
                          ))}
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-lg font-bold mb-2">총 금액</div>
                            <div className="text-right text-xl font-bold text-blue-600">
                              ₩ {totalAmount.toLocaleString()}원
                            </div>
                          </div>
                          <div className="bg-white p-3 rounded-lg">
                            <div className="text-lg font-bold mb-2">정산 금액</div>
                            {Object.entries(amountPerPerson).map(([personNumber, amount]) => (
                              <div key={personNumber} className="flex justify-between items-center text-base mb-1">
                                <span className="text-gray-700">{personNumber}번</span>
                                <span className="font-medium text-blue-600">{amount.toLocaleString()}원</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button
                          className="toss-button"
                          onClick={handleSaveImage}
                        >
                          저장하기
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button 
                    className="w-full toss-button py-3.5 text-base flex items-center justify-center"
                    onClick={() => setShowImageModal(true)}
                  >
                    <span className="material-icons mr-1">download</span>
                    이미지 저장
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Todo Modal */}
      {showTodoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="text-center">
              <span className="material-icons text-6xl text-gray-400 mb-4">construction</span>
              <h3 className="text-lg font-bold mb-2">곧 만나요!</h3>
              <p className="text-gray-600 mb-6">영수증 인식 기능은 현재 개발 중입니다.</p>
              <button
                className="toss-button w-full"
                onClick={() => setShowTodoModal(false)}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* People Selection Modal */}
      {showPeopleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">참여 인원 선택</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={closePeopleModal}
              >
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: numPeople }, (_, i) => i + 1).map((personNumber) => {
                const currentItem = items.find(item => item.id === currentItemId);
                const isSelected = currentItem?.selectedPeople.includes(personNumber);
                return (
                  <button
                    key={personNumber}
                    className={`p-3 rounded-lg border ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                    onClick={() => togglePersonSelection(currentItemId, personNumber)}
                  >
                    {personNumber}번
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                className="toss-button"
                onClick={closePeopleModal}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettlementCalculator; 